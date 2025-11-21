import { compactJsonl, reindex } from "../services/admin";

/**
 * Run weekly maintenance tasks.
 * Called by the scheduled handler in index.ts.
 */
export async function runWeeklyMaintenance(env: Env): Promise<void> {
	console.log("Starting weekly maintenance...");

	try {
		// Rebuild indexes
		await reindex(env);
		console.log("Reindex completed");

		// Compact JSONL files
		await compactJsonl(env);
		console.log("JSONL compaction completed");

		// Add other maintenance tasks here
		// - Clean up expired sessions
		// - Purge old cache entries
		// - Generate sitemap
		// - etc.

		console.log("Weekly maintenance completed successfully");
	} catch (error) {
		console.error("Weekly maintenance failed:", error);
		throw error;
	}
}
