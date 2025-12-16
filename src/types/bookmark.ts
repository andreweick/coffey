import { z } from "zod";
import {
	RaindropMediaSchema,
	RaindropCollectionRefSchema,
	RaindropSchema,
	CollectionSchema,
	CollectionListResponseSchema,
	RaindropListResponseSchema,
	CollectionSnapshotSchema,
	BookmarkCoverSchema,
	BookmarkArtifactSchema,
	BookmarkDataSchema,
	BookmarkSchema,
	BookmarkQueueMessageSchema,
} from "../schemas/bookmark-schemas";

// ============================================================================
// INFERRED TYPESCRIPT TYPES FROM ZOD SCHEMAS
// ============================================================================

// Raindrop API types
export type RaindropMedia = z.infer<typeof RaindropMediaSchema>;
export type RaindropCollectionRef = z.infer<typeof RaindropCollectionRefSchema>;
export type Raindrop = z.infer<typeof RaindropSchema>;
export type Collection = z.infer<typeof CollectionSchema>;
export type CollectionListResponse = z.infer<typeof CollectionListResponseSchema>;
export type RaindropListResponse = z.infer<typeof RaindropListResponseSchema>;

// Bookmark storage types
export type CollectionSnapshot = z.infer<typeof CollectionSnapshotSchema>;
export type BookmarkCover = z.infer<typeof BookmarkCoverSchema>;
export type BookmarkArtifact = z.infer<typeof BookmarkArtifactSchema>;
export type BookmarkData = z.infer<typeof BookmarkDataSchema>;
export type Bookmark = z.infer<typeof BookmarkSchema>;

// Queue message types
export type BookmarkQueueMessage = z.infer<typeof BookmarkQueueMessageSchema>;
