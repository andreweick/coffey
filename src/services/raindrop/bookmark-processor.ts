import type { Raindrop, Bookmark, BookmarkData, Collection } from "../../types/bookmark";

/**
 * Serialize object to canonical JSON with stable key ordering
 */
function canonicalJSON(obj: any): string {
	if (obj === null || typeof obj !== "object") {
		return JSON.stringify(obj);
	}

	if (Array.isArray(obj)) {
		return "[" + obj.map((item) => canonicalJSON(item)).join(",") + "]";
	}

	const keys = Object.keys(obj).sort();
	const pairs = keys.map((key) => `"${key}":${canonicalJSON(obj[key])}`);
	return "{" + pairs.join(",") + "}";
}

/**
 * Compute SHA-256 hash of JSON data
 */
async function hashJSON(data: Record<string, any>): Promise<string> {
	const canonical = canonicalJSON(data);
	const encoder = new TextEncoder();
	const buffer = encoder.encode(canonical);
	const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Convert Raindrop to BookmarkData (following ApiSnapshot pattern)
 */
function raindropToBookmarkData(
	raindrop: Raindrop,
	collection?: Collection
): BookmarkData {
	const now = new Date().toISOString();

	const bookmarkData: BookmarkData = {
		// Raindrop API snapshot (complete response)
		raindrop: {
			captured_at: now,
			provider: {
				name: "raindrop.io",
				product: "api",
				version: "v1",
			},
			summary: raindrop, // Store complete API response
		},
	};

	// Add collection snapshot if provided
	if (collection) {
		bookmarkData.collection = {
			id: collection._id,
			title: collection.title,
			parent_id: collection.parent?.$id,
		};
	}

	return bookmarkData;
}

/**
 * Create bookmark from raindrop
 * @param raindrop - Raindrop from API
 * @param collection - Optional collection metadata
 * @returns Complete Bookmark object with SHA-256 hash
 */
export async function createBookmark(
	raindrop: Raindrop,
	collection?: Collection
): Promise<Bookmark> {
	// Convert raindrop to bookmark data
	const bookmarkData = raindropToBookmarkData(raindrop, collection);

	// Compute SHA-256 hash of bookmark data
	const hash = await hashJSON(bookmarkData);

	// Generate timestamp for when we archived it
	const now = new Date().toISOString();

	// Build final Bookmark envelope
	const bookmark: Bookmark = {
		type: "bookmark",
		id: `sha256:${hash}`,
		schema_version: "1.0.0",
		created_at: now,
		sha256: hash,
		data: bookmarkData,
	};

	return bookmark;
}

/**
 * Get R2 key for bookmark JSON
 * Format: bookmarks/json/YYYY-MM-DD-sha_{hash}.json
 */
export function getBookmarkJsonKey(bookmark: Bookmark): string {
	const hash = bookmark.sha256;
	const date = bookmark.data.raindrop.summary.created.substring(0, 10); // YYYY-MM-DD
	return `bookmarks/json/${date}-sha_${hash}.json`;
}

/**
 * Store bookmark JSON to R2
 * @param bookmark - Complete Bookmark object
 * @param env - Environment bindings
 * @returns R2 object key
 */
export async function storeBookmarkJson(
	bookmark: Bookmark,
	env: Env
): Promise<string> {
	const objectKey = getBookmarkJsonKey(bookmark);

	// Serialize bookmark to JSON
	const jsonString = JSON.stringify(bookmark, null, 2);

	// Upload to R2
	await env.COFFEY_BUCKET.put(objectKey, jsonString, {
		httpMetadata: {
			contentType: "application/json",
		},
		customMetadata: {
			"bookmark-uuid": bookmark.data.raindrop.summary._id.toString(),
			"bookmark-sha256": bookmark.sha256,
			"raindrop-created": bookmark.data.raindrop.summary.created,
		},
	});

	return objectKey;
}
