import { extractMetadata } from "./metadata-extractor";
import { fetchWeather } from "./environment/weather-unified";
import { fetchElevation } from "./environment/google-elevation";
import { reverseGeocodeFull } from "./environment/google-places";
import { fetchNearbyPlaces } from "./environment/google-places-nearby";
import type { ImageMetadata, UploadImageResponse } from "../types/image";
import { getErrorMessage } from "../lib/errors";

/**
 * Allowed image MIME types
 */
const ALLOWED_IMAGE_TYPES = [
	"image/jpeg",
	"image/png",
	"image/gif",
	"image/webp",
];

/**
 * Error class for image upload validation failures
 */
export class ImageUploadError extends Error {
	constructor(
		message: string,
		public statusCode: number = 400
	) {
		super(message);
		this.name = "ImageUploadError";
	}
}

/**
 * Generate SHA-256 hash of file content
 */
async function hashFile(file: File): Promise<string> {
	const buffer = await file.arrayBuffer();
	const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Get file extension from MIME type
 */
function getExtension(mimeType: string): string {
	const extensions: Record<string, string> = {
		"image/jpeg": "jpg",
		"image/png": "png",
		"image/gif": "gif",
		"image/webp": "webp",
	};
	return extensions[mimeType] || "bin";
}

/**
 * Upload image to Cloudflare Hosted Images
 * @param file - Image file to upload
 * @param env - Environment bindings
 * @param metadata - Image metadata to attach
 * @returns UUID of the uploaded image
 */
async function uploadToCloudflareImages(
	file: File,
	env: Env,
	metadata: Record<string, string>
): Promise<string> {
	const apiToken = await env.CLOUDFLARE_MEDIA_TOKEN.get();
	if (!apiToken) {
		throw new ImageUploadError("CLOUDFLARE_MEDIA_TOKEN not configured", 500);
	}

	const accountId = env.CLOUDFLARE_ACCOUNT_ID;
	const formData = new FormData();
	formData.append("file", file);
	formData.append("requireSignedURLs", "true");

	// Add metadata as JSON
	formData.append("metadata", JSON.stringify(metadata));

	const response = await fetch(
		`https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1`,
		{
			method: "POST",
			headers: {
				Authorization: `Bearer ${apiToken}`,
			},
			body: formData,
		}
	);

	if (!response.ok) {
		const errorText = await response.text();
		throw new ImageUploadError(
			`Cloudflare Images upload failed: ${response.status} ${errorText}`,
			500
		);
	}

	const result = await response.json() as {
		success: boolean;
		result?: { id: string };
		errors?: Array<{ message: string }>;
	};

	if (!result.success || !result.result?.id) {
		const errorMsg = result.errors?.map(e => e.message).join(", ") || "Unknown error";
		throw new ImageUploadError(
			`Cloudflare Images upload failed: ${errorMsg}`,
			500
		);
	}

	return result.result.id;
}

async function checkForDuplicateImage(
	hash: string,
	env: Env
): Promise<ImageUploadResponse | null> {
	const existingImage = await env.COFFEY_DB.prepare(
		`SELECT sha256, uuid, original_filename, date_taken, created_at
		 FROM images
		 WHERE sha256 = ? AND deleted_at IS NULL`
	)
		.bind(hash)
		.first<{
			sha256: string;
			uuid: string;
			original_filename: string;
			date_taken: string | null;
			created_at: string;
		}>();

	if (!existingImage) {
		return null;
	}

	return {
		objectKey: `images/sha_${hash}`,
		uuid: existingImage.uuid,
		metadata: {
			file: {
				width: 0,
				height: 0,
				size: 0,
				mimeType: "",
				format: "",
			},
		},
		uploaded_at: existingImage.created_at,
		is_duplicate: true,
	};
}

async function enrichImageWithEnvironment(
	metadata: ImageMetadata,
	env: Env
): Promise<void> {
	if (!metadata.exif?.latitude || !metadata.exif?.longitude) {
		return;
	}

	const lat = metadata.exif.latitude;
	const lng = metadata.exif.longitude;
	const datetime = metadata.exif.dateTimeOriginal;

	const enrichmentPromises = [];

	if (datetime) {
		enrichmentPromises.push(
			fetchWeather(lat, lng, datetime, env)
				.then((weather) => {
					// Only assign weather if not null (null = future date or invalid)
					if (weather) {
						metadata.weather = weather;
					}
				})
				.catch(() => {})
		);
	}

	enrichmentPromises.push(
		fetchElevation(lat, lng, env)
			.then((elevation) => {
				metadata.elevation = elevation;
			})
			.catch(() => {})
	);

	enrichmentPromises.push(
		reverseGeocodeFull(lat, lng, env)
			.then((geocoding) => {
				metadata.geocoding = geocoding;
			})
			.catch(() => {})
	);

	enrichmentPromises.push(
		fetchNearbyPlaces(lat, lng, env)
			.then((nearbyPlaces) => {
				metadata.nearby_places = nearbyPlaces;
			})
			.catch(() => {})
	);

	await Promise.all(enrichmentPromises);
}

function buildCustomMetadata(
	file: File,
	hash: string,
	metadata: ImageMetadata,
	uploaded_at: string
): Record<string, string> {
	const customMetadata: Record<string, string> = {
		"uploaded-at": uploaded_at,
		"original-filename": file.name,
		"file-size": file.size.toString(),
		"sha256": hash,
	};

	if (metadata.file.width) {
		customMetadata["width"] = metadata.file.width.toString();
	}
	if (metadata.file.height) {
		customMetadata["height"] = metadata.file.height.toString();
	}
	if (metadata.file.format) {
		customMetadata["format"] = metadata.file.format;
	}

	if (metadata.exif) {
		if (metadata.exif.make) customMetadata["exif-make"] = metadata.exif.make;
		if (metadata.exif.model) customMetadata["exif-model"] = metadata.exif.model;
		if (metadata.exif.lensModel) customMetadata["exif-lens-model"] = metadata.exif.lensModel;
		if (metadata.exif.dateTimeOriginal) customMetadata["exif-date-time-original"] = metadata.exif.dateTimeOriginal;
		if (metadata.exif.latitude) customMetadata["exif-gps-latitude"] = metadata.exif.latitude.toString();
		if (metadata.exif.longitude) customMetadata["exif-gps-longitude"] = metadata.exif.longitude.toString();
		if (metadata.exif.iso) customMetadata["exif-iso"] = metadata.exif.iso.toString();
		if (metadata.exif.fNumber) customMetadata["exif-f-number"] = metadata.exif.fNumber.toString();
		if (metadata.exif.exposureTime) customMetadata["exif-exposure-time"] = metadata.exif.exposureTime.toString();
		if (metadata.exif.focalLength) customMetadata["exif-focal-length"] = metadata.exif.focalLength.toString();
		if (metadata.exif.software) customMetadata["exif-software"] = metadata.exif.software;
	}

	if (metadata.iptc) {
		if (metadata.iptc.objectName) customMetadata["iptc-title"] = metadata.iptc.objectName;
		if (metadata.iptc.caption) customMetadata["iptc-caption"] = metadata.iptc.caption;
		if (metadata.iptc.keywords) customMetadata["iptc-keywords"] = metadata.iptc.keywords.join(", ");
		if (metadata.iptc.copyrightNotice) customMetadata["iptc-copyright"] = metadata.iptc.copyrightNotice;
		if (metadata.iptc.creator) customMetadata["iptc-creator"] = metadata.iptc.creator;
		if (metadata.iptc.credit) customMetadata["iptc-credit"] = metadata.iptc.credit;
		if (metadata.iptc.city) customMetadata["iptc-city"] = metadata.iptc.city;
		if (metadata.iptc.country) customMetadata["iptc-country"] = metadata.iptc.country;
	}

	if (metadata.icc) {
		if (metadata.icc.colorSpace) customMetadata["icc-color-space"] = metadata.icc.colorSpace;
		if (metadata.icc.description) customMetadata["icc-profile-description"] = metadata.icc.description;
	}

	return customMetadata;
}

function buildImageRecord(
	uuid: string,
	hash: string,
	file: File,
	metadata: ImageMetadata,
	uploaded_at: string
): any {
	const environment: any = {};
	if (metadata.geocoding) environment.geocoding = metadata.geocoding;
	if (metadata.elevation) environment.elevation = metadata.elevation;
	if (metadata.weather) environment.weather = metadata.weather;
	if (metadata.nearby_places) environment.nearby_places = metadata.nearby_places;

	return {
		type: "image" as const,
		id: uuid,
		schema_version: "1.0",
		created_at: uploaded_at,
		sha256: hash,
		original_filename: file.name,
		data: {
			file: metadata.file,
			...(metadata.exif && { exif: metadata.exif }),
			...(metadata.iptc && { iptc: metadata.iptc }),
			...(metadata.icc && { icc: metadata.icc }),
			...(Object.keys(environment).length > 0 && { environment }),
		},
	};
}

async function saveImageRecord(
	imageRecord: any,
	hash: string,
	file: File,
	metadata: ImageMetadata,
	uploaded_at: string,
	uuid: string,
	env: Env
): Promise<void> {
	try {
		// Use EXIF date-taken if available, otherwise fall back to upload date
		const dateTaken = metadata.exif?.dateTimeOriginal
			? metadata.exif.dateTimeOriginal.substring(0, 10)
			: uploaded_at.substring(0, 10);
		const metadataKey = `images/json/${dateTaken}_sha_${hash}.json`;
		const imageJson = JSON.stringify(imageRecord, null, 2);

		await env.COFFEY_BUCKET.put(metadataKey, imageJson, {
			httpMetadata: {
				contentType: "application/json",
			},
		});
	} catch (error) {
		// Continue even if JSON storage fails
	}

	try {
		await env.COFFEY_DB.prepare(
			`INSERT INTO images (sha256, uuid, original_filename, date_taken, created_at, updated_at)
			 VALUES (?1, ?2, ?3, ?4, ?5, ?6)`
		)
			.bind(
				hash,
				uuid,
				file.name,
				metadata.exif?.dateTimeOriginal || null,
				uploaded_at,
				uploaded_at
			)
			.run();
	} catch (error) {
		// Continue even if D1 insert fails
	}
}

/**
 * Uploads an image to Cloudflare Hosted Images with metadata extraction
 * @param file - Image file to upload
 * @param env - Environment bindings
 * @returns Upload response with object key, UUID, metadata, and timestamp
 * @throws ImageUploadError if validation fails, metadata extraction fails, or upload errors
 */
export async function uploadImage(
	file: File,
	env: Env
): Promise<ImageUploadResponse> {
	if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
		throw new ImageUploadError(
			`Invalid file type: ${file.type}. Allowed types: ${ALLOWED_IMAGE_TYPES.join(", ")}`,
			400
		);
	}

	const hash = await hashFile(file);

	const duplicate = await checkForDuplicateImage(hash, env);
	if (duplicate) {
		return duplicate;
	}

	const metadata = await extractMetadata(file);

	if (metadata.exif?.dateTimeOriginal && metadata.exif.dateTimeOriginal instanceof Date) {
		metadata.exif.dateTimeOriginal = metadata.exif.dateTimeOriginal.toISOString();
	}

	await enrichImageWithEnvironment(metadata, env);

	const uploaded_at = new Date().toISOString();
	const customMetadata = buildCustomMetadata(file, hash, metadata, uploaded_at);

	let uuid: string;
	try {
		uuid = await uploadToCloudflareImages(file, env, customMetadata);
	} catch (error) {
		throw new ImageUploadError(
			`Image upload failed: ${getErrorMessage(error)}`,
			500
		);
	}

	const imageRecord = buildImageRecord(uuid, hash, file, metadata, uploaded_at);
	await saveImageRecord(imageRecord, hash, file, metadata, uploaded_at, uuid, env);

	// Return response with public URL path, UUID, metadata, and timestamp
	const publicUrl = `images/sha_${hash}`;
	return {
		objectKey: publicUrl,
		uuid,
		metadata,
		uploaded_at,
		is_duplicate: false,
	};
}
