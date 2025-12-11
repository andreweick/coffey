import { z } from "zod";
import {
	ApiSnapshot_WeatherSchema,
	ApiSnapshot_ElevationSchema,
	ApiSnapshot_GeocodingSchema,
	ApiSnapshot_NearbyPlacesSchema
} from "./chatter-schemas";

// ============================================================================
// IMAGE METADATA SCHEMAS
// ============================================================================

/**
 * Basic file information
 */
export const ImageFileInfoSchema = z.object({
	width: z.number().optional().describe("Image width in pixels"),
	height: z.number().optional().describe("Image height in pixels"),
	size: z.number().describe("File size in bytes"),
	mimeType: z.string().describe("MIME type (e.g., image/jpeg)"),
	format: z.string().optional().describe("Image format (jpeg, png, webp, gif)"),
});

/**
 * EXIF metadata (camera settings, GPS, timestamp)
 */
export const ImageExifSchema = z.object({
	make: z.string().optional().describe("Camera manufacturer"),
	model: z.string().optional().describe("Camera model"),
	lensModel: z.string().optional().describe("Lens model"),
	dateTimeOriginal: z.string().optional().describe("Date/time photo was taken"),
	latitude: z.number().optional().describe("GPS latitude"),
	longitude: z.number().optional().describe("GPS longitude"),
	iso: z.number().optional().describe("ISO speed"),
	fNumber: z.number().optional().describe("F-number (aperture)"),
	exposureTime: z.number().optional().describe("Exposure time in seconds"),
	focalLength: z.number().optional().describe("Focal length in mm"),
	orientation: z.number().optional().describe("Image orientation"),
	software: z.string().optional().describe("Software used to process image"),
});

/**
 * IPTC metadata (title, description, keywords, copyright)
 */
export const ImageIptcSchema = z.object({
	objectName: z.string().optional().describe("Image title/object name"),
	caption: z.string().optional().describe("Image caption/description"),
	keywords: z.array(z.string()).optional().describe("Keywords/tags"),
	copyrightNotice: z.string().optional().describe("Copyright notice"),
	creator: z.string().optional().describe("Creator/photographer name"),
	credit: z.string().optional().describe("Credit line"),
	city: z.string().optional().describe("City where image was taken"),
	country: z.string().optional().describe("Country where image was taken"),
});

/**
 * ICC color profile information
 */
export const ImageIccSchema = z.object({
	colorSpace: z.string().optional().describe("Color space (e.g., sRGB, Adobe RGB)"),
	description: z.string().optional().describe("Color profile description"),
});

/**
 * Environment data (grouped enrichments from GPS coordinates)
 */
export const ImageEnvironmentSchema = z.object({
	geocoding: ApiSnapshot_GeocodingSchema.optional().describe("Reverse geocoded location (city, state, country) from GPS coordinates"),
	elevation: ApiSnapshot_ElevationSchema.optional().describe("Elevation data for photo location (from GPS coordinates)"),
	weather: ApiSnapshot_WeatherSchema.optional().describe("Weather conditions when photo was taken (from GPS + datetime)"),
	nearby_places: ApiSnapshot_NearbyPlacesSchema.optional().describe("Nearby points of interest within 500m of photo location (from GPS coordinates)"),
});

/**
 * Image data (inner payload, similar to ChatterDataSchema)
 */
export const ImageDataSchema = z.object({
	file: ImageFileInfoSchema.describe("Basic file information"),
	exif: ImageExifSchema.optional().describe("EXIF camera metadata"),
	iptc: ImageIptcSchema.optional().describe("IPTC descriptive metadata"),
	icc: ImageIccSchema.optional().describe("ICC color profile information"),
	environment: ImageEnvironmentSchema.optional().describe("Environmental enrichment data (weather, elevation, geocoding)"),
});

/**
 * Complete image metadata (for backwards compatibility)
 */
export const ImageMetadataSchema = z.object({
	file: ImageFileInfoSchema.describe("Basic file information"),
	exif: ImageExifSchema.optional().describe("EXIF camera metadata"),
	iptc: ImageIptcSchema.optional().describe("IPTC descriptive metadata"),
	icc: ImageIccSchema.optional().describe("ICC color profile information"),
	weather: ApiSnapshot_WeatherSchema.optional().describe("Weather conditions when photo was taken (from GPS + datetime)"),
	elevation: ApiSnapshot_ElevationSchema.optional().describe("Elevation data for photo location (from GPS coordinates)"),
	geocoding: ApiSnapshot_GeocodingSchema.optional().describe("Reverse geocoded location (city, state, country) from GPS coordinates"),
	nearby_places: ApiSnapshot_NearbyPlacesSchema.optional().describe("Nearby points of interest within 500m of photo location (from GPS coordinates)"),
});

/**
 * Image record (complete storage format, similar to ChatterSchema)
 */
export const ImageSchema = z.object({
	type: z.literal("image"),
	id: z.string().describe("Cloudflare Images UUID"),
	schema_version: z.string().optional().describe("Schema version for future migrations"),
	created_at: z.string().datetime().describe("When the image was uploaded"),
	sha256: z.string().describe("SHA-256 content hash"),
	original_filename: z.string().describe("Original filename from upload"),
	data: ImageDataSchema.describe("Image metadata and enrichments"),
});

// ============================================================================
// API REQUEST/RESPONSE SCHEMAS
// ============================================================================

/**
 * Response from image upload
 */
export const UploadImageResponseSchema = z.object({
	objectKey: z.string().describe("Public image URL path without extension (images/sha_{hash})"),
	uuid: z.string().uuid().optional().describe("Unique identifier for this image upload"),
	metadata: ImageMetadataSchema.describe("Extracted image metadata"),
	uploaded_at: z.string().datetime().describe("Upload timestamp (ISO 8601)"),
	is_duplicate: z.boolean().optional().describe("True if this hash already existed (not a new upload)"),
});

/**
 * Single image in list response
 */
export const ImageListItemSchema = z.object({
	key: z.string().describe("R2 object key"),
	size: z.number().optional().describe("File size in bytes (only available when listing from R2)"),
	uploaded_at: z.string().datetime().describe("Upload timestamp"),
	etag: z.string().optional().describe("ETag for cache validation (only available when listing from R2)"),
	customMetadata: z.record(z.string()).optional().describe("Custom metadata headers"),
});

/**
 * Paginated list of images
 */
export const ImageListResponseSchema = z.object({
	images: z.array(ImageListItemSchema).describe("Array of images"),
	truncated: z.boolean().describe("Whether more results are available"),
	cursor: z.string().optional().describe("Cursor for next page"),
});

/**
 * Query parameters for list endpoint
 */
export const ImageListQuerySchema = z.object({
	limit: z.string().optional().describe("Maximum number of results (default: 100, max: 1000)"),
	cursor: z.string().optional().describe("Cursor from previous response for pagination"),
	prefix: z.string().optional().describe("Filter by key prefix (default: 'images/')"),
	// Search parameters for D1 queries
	uuid: z.string().optional().describe("Search by UUID"),
	sha256: z.string().optional().describe("Search by SHA-256 hash"),
	filename: z.string().optional().describe("Search by original filename"),
});

/**
 * Path parameter for delete endpoint
 */
export const ImageKeyParamSchema = z.object({
	key: z.string().describe("Image object key (e.g., images/sha_abc123.jpg)"),
});

/**
 * Response from delete endpoint
 */
export const DeleteImageResponseSchema = z.object({
	success: z.boolean().describe("Whether deletion was successful"),
	key: z.string().describe("Object key that was deleted"),
});
