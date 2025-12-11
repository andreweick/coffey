import { z } from "zod";
import {
	ImageFileInfoSchema,
	ImageExifSchema,
	ImageIptcSchema,
	ImageIccSchema,
	ImageEnvironmentSchema,
	ImageDataSchema,
	ImageSchema,
	ImageMetadataSchema,
	UploadImageResponseSchema,
	ImageListItemSchema,
	ImageListResponseSchema,
	ImageListQuerySchema,
	ImageKeyParamSchema,
	DeleteImageResponseSchema,
} from "../schemas/image-schemas";

// ============================================================================
// INFERRED TYPESCRIPT TYPES FROM ZOD SCHEMAS
// ============================================================================

export type ImageFileInfo = z.infer<typeof ImageFileInfoSchema>;
export type ImageExif = z.infer<typeof ImageExifSchema>;
export type ImageIptc = z.infer<typeof ImageIptcSchema>;
export type ImageIcc = z.infer<typeof ImageIccSchema>;
export type ImageEnvironment = z.infer<typeof ImageEnvironmentSchema>;
export type ImageData = z.infer<typeof ImageDataSchema>;
export type Image = z.infer<typeof ImageSchema>;
export type ImageMetadata = z.infer<typeof ImageMetadataSchema>;

export type UploadImageResponse = z.infer<typeof UploadImageResponseSchema>;
export type ImageListItem = z.infer<typeof ImageListItemSchema>;
export type ImageListResponse = z.infer<typeof ImageListResponseSchema>;
export type ImageListQuery = z.infer<typeof ImageListQuerySchema>;
export type ImageKeyParam = z.infer<typeof ImageKeyParamSchema>;
export type DeleteImageResponse = z.infer<typeof DeleteImageResponseSchema>;
