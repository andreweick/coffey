import { fetchRaindrop, fetchCollections } from "../services/raindrop/api-client";
import { createBookmark, storeBookmarkJson } from "../services/raindrop/bookmark-processor";
import { downloadAndStoreArtifactJson } from "../services/raindrop/artifact-downloader";
import type { BookmarkQueueMessage, Bookmark } from "../types/bookmark";
import { BookmarkQueueMessageSchema } from "../schemas/bookmark-schemas";

/**
 * Process bookmark - fetch metadata and artifact, store to D1/R2
 */
async function processBookmark(
	message: BookmarkQueueMessage,
	env: Env
): Promise<void> {
	const { raindrop_id, collection_id } = message;
	const kvKey = `bookmark:work:${raindrop_id}`;

	console.log(`Processing bookmark ${raindrop_id}`);

	try {
		// 1. Get work state from KV
		const workStateJson = await env.COFFEY_KV.get(kvKey);
		if (!workStateJson) {
			console.log(`No work state found for ${raindrop_id}, skipping`);
			return;
		}
		const workState = JSON.parse(workStateJson);

		// 2. Check if already in D1 (deduplication)
		const existing = await env.COFFEY_DB.prepare(
			"SELECT uuid FROM bookmark WHERE uuid = ?"
		).bind(raindrop_id).first();

		if (existing) {
			console.log(`Bookmark ${raindrop_id} already exists, cleaning up`);
			await env.COFFEY_KV.delete(kvKey);
			return;
		}

		// 3. Fetch raindrop metadata
		const raindrop = await fetchRaindrop(env, raindrop_id);
		const collections = await fetchCollections(env);
		const collection = collections.find((c) => c._id === collection_id);

		// 4. Create bookmark and store JSON to R2
		const bookmark = await createBookmark(raindrop, collection);
		await storeBookmarkJson(bookmark, env);
		await insertBookmarkToD1(bookmark, env);

		console.log(`Stored bookmark metadata for ${raindrop_id}`);

		// 5. Try to download artifact
		const cacheStatus = raindrop.cache?.status || "no-cache";

		if (cacheStatus === "ready") {
			console.log(`Attempting artifact download for ${raindrop_id}`);

			const artifactKey = await downloadAndStoreArtifactJson(
				raindrop._id,
				bookmark.sha256,
				raindrop,
				env
			);

			if (artifactKey) {
				// Success! Delete KV work item
				console.log(`✅ Bookmark ${raindrop_id} complete (with artifact)`);
				await env.COFFEY_KV.delete(kvKey);
				return;
			}

			console.log(`Artifact download failed for ${raindrop_id}`);
		}

		// 6. Artifact not ready or failed - handle retry
		if (workState.retry_count >= 14) {
			console.log(`Max retries exceeded for ${raindrop_id}, giving up`);
			await env.COFFEY_KV.delete(kvKey);
			return;
		}

		// 7. Re-queue with delay
		workState.retry_count++;
		workState.last_attempt_at = new Date().toISOString();

		await env.COFFEY_KV.put(
			kvKey,
			JSON.stringify(workState),
			{ expirationTtl: 60 * 60 * 24 * 14 }
		);

		await env.BOOKMARK_SYNC_QUEUE.send(
			{ raindrop_id, collection_id },
			{ delaySeconds: 43200 } // 12 hours
		);

		console.log(`Re-queued ${raindrop_id} (retry ${workState.retry_count}/14)`);
	} catch (error) {
		console.error(`Error processing bookmark ${raindrop_id}:`, error);
		throw error;
	}
}

/**
 * Insert bookmark into D1 database
 */
async function insertBookmarkToD1(bookmark: Bookmark, env: Env): Promise<void> {
	const raindrop = bookmark.data.raindrop.summary;
	const collection = bookmark.data.collection;

	await env.COFFEY_DB.prepare(
		`INSERT OR REPLACE INTO bookmark (
			uuid,
			sha256,
			link,
			title,
			excerpt,
			domain,
			type,
			cover_url,
			collection_id,
			collection_title,
			tags,
			created_at,
			updated_at,
			synced_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
	)
		.bind(
			raindrop._id,
			bookmark.sha256,
			raindrop.link,
			raindrop.title,
			raindrop.excerpt || null,
			raindrop.domain || null,
			raindrop.type,
			raindrop.cover || null,
			collection?.id || null,
			collection?.title || null,
			raindrop.tags ? JSON.stringify(raindrop.tags) : null,
			raindrop.created,
			raindrop.lastUpdate,
			bookmark.created_at
		)
		.run();
}

/**
 * Handle bookmark queue batch
 */
export async function handleBookmarkQueue(
	batch: MessageBatch<BookmarkQueueMessage>,
	env: Env,
	ctx: ExecutionContext
): Promise<void> {
	console.log(`Processing bookmark queue batch: ${batch.messages.length} messages`);

	for (const msg of batch.messages) {
		try {
			// Parse and validate message
			const message = BookmarkQueueMessageSchema.parse(msg.body);

			// Process the bookmark
			await processBookmark(message, env);

			// Ack the message
			msg.ack();
		} catch (error) {
			console.error("Error processing message:", error);
			// Don't ack - message will be retried
			msg.retry();
		}
	}

	console.log(`Bookmark queue batch complete`);
}
