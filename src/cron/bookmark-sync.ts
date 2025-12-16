import { fetchRaindrops } from "../services/raindrop/api-client";
import type { BookmarkQueueMessage } from "../types/bookmark";

/**
 * Run bookmark sync cron job
 * Simply checks newest 50 bookmarks and creates KV work entries for new ones
 */
export async function runBookmarkSync(
	env: Env,
	ctx: ExecutionContext
): Promise<void> {
	try {
		// Check if cron is enabled
		if (!env.CRON_ENABLE) {
			console.log("Cron disabled (CRON_ENABLE=false)");
			return;
		}

		console.log("Starting bookmark sync (checking newest 50)");

		// Fetch newest 50 bookmarks from API
		const response = await fetchRaindrops(env, {
			collectionId: 0, // All raindrops
			perpage: 50, // Always fetch 50 (max we need to check)
			sort: "-created", // Newest first
		});

		if (response.items.length === 0) {
			console.log("No raindrops found");
			return;
		}

		console.log(`Fetched ${response.items.length} raindrops from API`);

		let newCount = 0;
		let existingCount = 0;

		// Check each raindrop against D1
		for (const raindrop of response.items) {
			const exists = await env.COFFEY_DB.prepare(
				"SELECT 1 FROM bookmark WHERE uuid = ?"
			).bind(raindrop._id).first();

			if (!exists) {
				// New bookmark! Create KV work entry
				const kvKey = `bookmark:work:${raindrop._id}`;
				await env.COFFEY_KV.put(
					kvKey,
					JSON.stringify({
						raindrop_id: raindrop._id,
						collection_id: raindrop.collection.$id,
						created_at: new Date().toISOString(),
						retry_count: 0,
					}),
					{ expirationTtl: 60 * 60 * 24 * 14 } // 14 days
				);

				// Queue for processing with random delay (1-11 hours)
				const randomHours = Math.floor(Math.random() * 11) + 1;
				const message: BookmarkQueueMessage = {
					raindrop_id: raindrop._id,
					collection_id: raindrop.collection.$id,
				};
				await env.BOOKMARK_SYNC_QUEUE.send(message, {
					delaySeconds: randomHours * 3600
				});

				newCount++;
			} else {
				existingCount++;
			}
		}

		console.log(`Sync complete: ${newCount} new, ${existingCount} existing`);
	} catch (error) {
		console.error("Error in bookmark sync:", error);
		throw error;
	}
}
