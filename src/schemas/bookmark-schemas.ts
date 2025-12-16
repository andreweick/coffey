import { z } from "zod";

// ============================================================================
// RAINDROP API RESPONSE SCHEMAS
// ============================================================================

/**
 * Raindrop media object (cover images)
 */
export const RaindropMediaSchema = z.object({
	link: z.string().url(),
});

/**
 * Raindrop collection reference
 */
export const RaindropCollectionRefSchema = z.object({
	$id: z.number(),
});

/**
 * Raw raindrop from Raindrop.io API (complete with all available fields)
 */
export const RaindropSchema = z.object({
	// Core fields
	_id: z.number(),
	link: z.string(),
	title: z.string(),
	excerpt: z.string().optional(),
	note: z.string().optional(),
	type: z.enum(["link", "article", "image", "video", "document", "audio"]),
	tags: z.array(z.string()).optional(),
	cover: z.string().optional().describe("Cover image URL"),
	media: z.array(RaindropMediaSchema).optional().describe("Media array with cover images"),
	domain: z.string().optional(),
	created: z.string(),
	lastUpdate: z.string(),
	collection: RaindropCollectionRefSchema,

	// Permanent copy cache (PRO feature)
	cache: z.object({
		status: z.string(),
		size: z.number().optional(),
		created: z.string().optional(),
	}).optional().describe("Permanent copy cache status (requires Raindrop PRO)"),

	// Additional metadata fields
	broken: z.boolean().optional().describe("Marked as broken link"),
	important: z.boolean().optional().describe("Marked as favorite/important"),
	user: z.object({
		$id: z.number(),
	}).optional().describe("Owner user ID"),

	// Highlights and annotations
	highlights: z.array(z.object({
		text: z.string(),
		color: z.string(),
		note: z.string().optional(),
		created: z.string(),
	})).optional().describe("Text highlights with annotations"),

	// Reminders
	reminder: z.object({
		date: z.string(),
	}).optional().describe("Reminder date setting"),

	// File uploads
	file: z.object({
		name: z.string(),
		size: z.number(),
		type: z.string(),
	}).optional().describe("Uploaded file metadata"),

	// Original creator reference
	creatorRef: z.object({
		_id: z.number(),
		fullName: z.string().optional(),
	}).optional().describe("Original author/creator"),

	// Sort position
	order: z.number().optional().describe("Custom sort order"),
});

/**
 * Collection metadata from Raindrop API
 */
export const CollectionSchema = z.object({
	_id: z.number(),
	title: z.string(),
	count: z.number().optional(),
	parent: z.object({
		$id: z.number(),
	}).optional(),
	created: z.string().optional(),
	lastUpdate: z.string().optional(),
});

/**
 * Collections list response
 */
export const CollectionListResponseSchema = z.object({
	result: z.boolean(),
	items: z.array(CollectionSchema),
});

/**
 * Raindrop API list response
 */
export const RaindropListResponseSchema = z.object({
	result: z.boolean(),
	items: z.array(RaindropSchema),
	count: z.number().optional(),
	collectionId: z.number().optional(),
});

// ============================================================================
// BOOKMARK STORAGE SCHEMAS
// ============================================================================

/**
 * Collection snapshot (denormalized in bookmark)
 */
export const CollectionSnapshotSchema = z.object({
	id: z.number(),
	title: z.string(),
	parent_id: z.number().optional(),
});

/**
 * Cover image metadata
 */
export const BookmarkCoverSchema = z.object({
	url: z.string().url().describe("Original cover image URL from Raindrop"),
});

/**
 * Permanent copy/artifact metadata (stored separately in artifacts/json/)
 */
export const BookmarkArtifactSchema = z.object({
	type: z.literal("bookmark-artifact"),
	schema_version: z.string().default("1.0").describe("Schema version for migrations"),
	id: z.string().describe("Format: sha256:{hash}"),
	sha256: z.string().describe("SHA-256 hash of bookmark"),
	created_at: z.string().datetime().describe("When artifact was archived (ISO 8601)"),
	data: z.object({
		uuid: z.number().describe("Raindrop ID"),
		link: z.string().url().describe("Original bookmark URL"),
		content: z.string().describe("HTML content from permanent copy"),
		content_type: z.string().default("text/html").describe("MIME type"),
		size_bytes: z.number().describe("File size in bytes"),
		archived_at: z.string().datetime().describe("When the permanent copy was downloaded (ISO 8601)"),
		raindrop_cache_created: z.string().datetime().optional().describe("When Raindrop cached the page"),
	}),
});

/**
 * Bookmark data (inner payload) - follows ApiSnapshot pattern like chatter/images
 */
export const BookmarkDataSchema = z.object({
	// Raindrop API snapshot (complete API response)
	raindrop: z.object({
		captured_at: z.string().datetime().describe("When this snapshot was captured (ISO 8601)"),
		provider: z.object({
			name: z.literal("raindrop.io"),
			product: z.literal("api"),
			version: z.literal("v1"),
		}),
		summary: RaindropSchema.describe("Complete Raindrop API response"),
	}).describe("Raindrop API snapshot following ApiSnapshot pattern"),

	// Denormalized collection for quick access
	collection: CollectionSnapshotSchema.optional().describe("Collection metadata snapshot"),
});

/**
 * Complete bookmark record (storage format)
 */
export const BookmarkSchema = z.object({
	type: z.literal("bookmark"),
	id: z.string().describe("Format: sha256:{hash}"),
	schema_version: z.string().describe("Schema version for migrations"),
	created_at: z.string().datetime().describe("When this bookmark was fetched/archived (ISO 8601)"),
	sha256: z.string().describe("SHA-256 hash of canonical bookmark data"),
	data: BookmarkDataSchema.describe("Bookmark data and metadata"),
});

// ============================================================================
// QUEUE MESSAGE SCHEMAS
// ============================================================================

/**
 * Message sent to bookmark sync queue
 */
export const BookmarkQueueMessageSchema = z.object({
	raindrop_id: z.number().describe("Raindrop ID to process"),
	collection_id: z.number().describe("Collection ID"),
});
