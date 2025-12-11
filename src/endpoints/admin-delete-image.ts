import { OpenAPIRoute } from "chanfana";
import type { Context } from "hono";
import { DeleteImageResponseSchema } from "../schemas/image-schemas";
import { adminErrorResponses, responses } from "../schemas/common";
import { errorResponse } from "../lib/errors";

export class AdminDeleteImage extends OpenAPIRoute {
	schema = {
		tags: ["Admin - Images"],
		summary: "Delete an image",
		description:
			"Delete an image from Cloudflare Hosted Images and mark as deleted in database. " +
			"Accepts the image hash (e.g., sha_abc123). Performs soft delete in database.",
		responses: {
			"200": {
				description: "Image deleted successfully",
				content: {
					"application/json": {
						schema: DeleteImageResponseSchema,
					},
				},
			},
			...adminErrorResponses,
			"404": responses.notFound("Image not found"),
		},
	};

	async handle(c: Context<{ Bindings: Env }>) {
		try {
			const filename = c.req.param("filename");
			// Extract hash from filename (e.g., "sha_abc123" -> "abc123")
			const hash = filename.startsWith("sha_") ? filename.slice(4) : filename;

			// Look up image UUID from database
			const result = await c.env.COFFEY_DB.prepare(
				`SELECT uuid FROM images WHERE sha256 = ? AND deleted_at IS NULL`
			)
				.bind(hash)
				.first<{ uuid: string }>();

			if (!result?.uuid) {
				return c.json(
					{
						error: "Image not found",
						details: `No image found with hash: ${hash}`,
					},
					404
				);
			}

			// Get API token from secrets
			const apiToken = await c.env.CLOUDFLARE_MEDIA_TOKEN.get();
			if (!apiToken) {
				return c.json(
					{
						error: "Configuration error",
						details: "CLOUDFLARE_MEDIA_TOKEN not configured",
					},
					500
				);
			}

			// Delete from Cloudflare Hosted Images
			const accountId = c.env.CLOUDFLARE_ACCOUNT_ID;
			const deleteResponse = await fetch(
				`https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1/${result.uuid}`,
				{
					method: "DELETE",
					headers: {
						Authorization: `Bearer ${apiToken}`,
					},
				}
			);

			if (!deleteResponse.ok) {
				const errorText = await deleteResponse.text();
				console.error("Cloudflare Images delete failed:", errorText);
				// Continue with soft delete even if Cloudflare deletion fails
			}

			// Soft delete in database
			const deletedAt = new Date().toISOString();
			await c.env.COFFEY_DB.prepare(
				`UPDATE images SET deleted_at = ? WHERE sha256 = ?`
			)
				.bind(deletedAt, hash)
				.run();

			return c.json(
				{
					success: true,
					key: `images/sha_${hash}`,
				},
				200
			);
		} catch (error) {
			return c.json(errorResponse("Internal server error", error), 500);
		}
	}
}
