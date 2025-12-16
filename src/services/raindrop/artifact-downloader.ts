import { getPermanentCopyUrl } from "./api-client";
import type { BookmarkArtifact, Raindrop } from "../../types/bookmark";

/**
 * Generate R2 key for bookmark artifact JSON
 * @param sha256 - Bookmark SHA-256 hash
 * @param createdAt - Bookmark created timestamp (ISO 8601)
 * @returns R2 key path
 */
export function getBookmarkArtifactKey(sha256: string, createdAt: string): string {
	const date = createdAt.substring(0, 10); // YYYY-MM-DD
	return `artifacts/json/${date}-sha_${sha256}.json`;
}

/**
 * Download permanent copy from Raindrop and store as JSON in R2
 * Note: Requires Raindrop PRO plan
 * @param raindropId - Raindrop ID
 * @param sha256 - Bookmark SHA-256 hash
 * @param raindrop - Full raindrop object with metadata
 * @param env - Environment bindings
 * @returns R2 key of stored artifact, or null if no permanent copy available
 */
export async function downloadAndStoreArtifactJson(
	raindropId: number,
	sha256: string,
	raindrop: Raindrop,
	env: Env
): Promise<string | null> {
	try {
		// Get permanent copy URL (returns 307 redirect)
		const permanentCopyUrl = await getPermanentCopyUrl(env, raindropId);

		if (!permanentCopyUrl) {
			// No permanent copy available
			return null;
		}

		// Download the permanent copy HTML
		const response = await fetch(permanentCopyUrl);
		if (!response.ok) {
			console.error(`Failed to download permanent copy: ${response.status}`);
			return null;
		}

		const htmlContent = await response.text();
		const contentType = response.headers.get("content-type") || "text/html";

		// Create JSON artifact wrapper
		const artifact: BookmarkArtifact = {
			type: "bookmark-artifact",
			schema_version: "1.0",
			id: `sha256:${sha256}`,
			sha256,
			created_at: new Date().toISOString(),
			data: {
				uuid: raindropId,
				link: raindrop.link,
				content: htmlContent,
				content_type: contentType,
				size_bytes: new Blob([htmlContent]).size,
				archived_at: new Date().toISOString(),
				raindrop_cache_created: raindrop.cache?.created,
			},
		};

		// Generate R2 key
		const r2Key = getBookmarkArtifactKey(sha256, raindrop.created);

		// Store JSON in R2
		await env.COFFEY_BUCKET.put(r2Key, JSON.stringify(artifact), {
			httpMetadata: {
				contentType: "application/json",
			},
			customMetadata: {
				"raindrop-id": raindropId.toString(),
				"bookmark-sha256": sha256,
			},
		});

		console.log(`Stored artifact: ${r2Key}`);
		return r2Key;
	} catch (error) {
		console.error(`Error downloading artifact for raindrop ${raindropId}:`, error);
		return null;
	}
}
