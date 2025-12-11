import { OpenAPIRoute } from "chanfana";
import type { Context } from "hono";
import { uploadImage, ImageUploadError } from "../services/image-upload";
import { UploadImageResponseSchema } from "../schemas/image-schemas";
import { adminErrorResponses, responses } from "../schemas/common";
import { errorResponse } from "../lib/errors";

export class AdminUploadImage extends OpenAPIRoute {
	schema = {
		tags: ["Admin - Images"],
		summary: "Upload an image with metadata extraction",
		description:
			"Upload an image file to Cloudflare Hosted Images. Automatically extracts and stores EXIF, IPTC, and ICC metadata. " +
			"Images are stored with content-addressable database keys (images/sha_{hash}) using SHA-256 hash to prevent duplicates. " +
			"Supports JPEG, PNG, GIF, and WebP formats.",
		requestBody: {
			required: true,
			content: {
				"multipart/form-data": {
					schema: {
						type: "object",
						properties: {
							file: {
								type: "string",
								format: "binary",
								description: "Image file to upload (JPEG, PNG, GIF, or WebP)",
							},
						},
						required: ["file"],
					},
				},
			},
		},
		responses: {
			"200": {
				description: "Image uploaded successfully",
				content: {
					"application/json": {
						schema: UploadImageResponseSchema,
					},
				},
			},
			"400": responses.badRequest("Invalid file type or metadata extraction failed"),
			...adminErrorResponses,
		},
	};

	async handle(c: Context<{ Bindings: Env }>) {
		try {
			// Parse multipart form data
			const formData = await c.req.formData();
			const file = formData.get("file");

			// Validate file was provided
			if (!file || !(file instanceof File)) {
				return c.json(
					{
						error: "No file provided",
						details: "Request must include a 'file' field with an image file",
					},
					400
				);
			}

			// Upload image with metadata extraction
			const result = await uploadImage(file, c.env);

			// Return 201 for new uploads, 200 for existing duplicates
			return c.json(result, result.is_duplicate ? 200 : 201);
		} catch (error) {
			// Handle ImageUploadError with specific status codes
			if (error instanceof ImageUploadError) {
				return c.json(
					{
						error: error.message,
					},
					error.statusCode
				);
			}

			// Handle unexpected errors
			return c.json(errorResponse("Internal server error", error), 500);
		}
	}
}
