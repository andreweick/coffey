import { OpenAPIRoute, Num, Str } from "chanfana";
import type { Context } from "hono";
import { z } from "zod";
import { ImageListResponseSchema } from "../schemas/image-schemas";
import { adminErrorResponses } from "../schemas/common";
import { errorResponse } from "../lib/errors";

/**
 * Transform D1 database row to image response format
 */
function transformImageRow(row: any) {
	return {
		key: `images/sha_${row.sha256}`,
		uploaded_at: row.created_at,
		customMetadata: {
			uuid: row.uuid || "",
			sha256: row.sha256,
			"original-filename": row.original_filename || "",
			"date-taken": row.date_taken || "",
		},
	};
}

export class AdminListImages extends OpenAPIRoute {
	schema = {
		tags: ["Admin - Images"],
		summary: "List or search images",
		description:
			"List all images from D1 database with pagination, or search by UUID/SHA256/filename. " +
			"If search parameters (uuid, sha256, or filename) are provided, performs exact match. " +
			"Otherwise, lists all non-deleted images with limit-based pagination.",
		request: {
			query: z.object({
				// Pagination for listing
				limit: Num({
					description: "Maximum number of results (default: 100, max: 1000)",
					required: false,
					default: 100,
				}),
				cursor: Str({
					description: "Deprecated - not used",
					required: false,
				}),
				prefix: Str({
					description: "Deprecated - not used",
					required: false,
					default: "images/",
				}),
				// Search parameters
				uuid: Str({
					description: "Search by UUID",
					required: false,
				}),
				sha256: Str({
					description: "Search by SHA-256 hash",
					required: false,
				}),
				filename: Str({
					description: "Search by original filename",
					required: false,
				}),
			}),
		},
		responses: {
			"200": {
				description: "List of images",
				content: {
					"application/json": {
						schema: ImageListResponseSchema,
					},
				},
			},
			...adminErrorResponses,
		},
	};

	async handle(c: Context<{ Bindings: Env }>) {
		try {
			const data = await this.getValidatedData<typeof this.schema>();

			// Parse query parameters
			const { uuid, sha256, filename } = data.query || {};
			const limit = Math.min(data.query?.limit || 100, 1000);
			const cursor = data.query?.cursor;
			const prefix = data.query?.prefix || "images/";

			// If search parameters provided, query D1
			if (uuid || sha256 || filename) {
				let query: string;
				let value: string;

				if (uuid) {
					query = "SELECT * FROM images WHERE uuid = ?1 AND deleted_at IS NULL";
					value = uuid;
				} else if (sha256) {
					query = "SELECT * FROM images WHERE sha256 = ?1 AND deleted_at IS NULL";
					value = sha256;
				} else {
					// filename search
					query = "SELECT * FROM images WHERE original_filename = ?1 AND deleted_at IS NULL";
					value = filename!;
				}

				const result = await c.env.COFFEY_DB.prepare(query).bind(value).all();

				// Transform D1 results to match response format
				// Note: size and etag are omitted (not available in D1, only in R2)
				const images = (result.results || []).map(transformImageRow);

				return c.json(
					{
						images,
						truncated: false,
						cursor: undefined,
					},
					200
				);
			}

			// No search params - list all images from D1
			const result = await c.env.COFFEY_DB.prepare(
				`SELECT * FROM images WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT ?1`
			)
				.bind(limit)
				.all();

			// Transform D1 results to response format
			const images = (result.results || []).map(transformImageRow);

			return c.json(
				{
					images,
					truncated: false,
					cursor: undefined,
				},
				200
			);
		} catch (error) {
			return c.json(errorResponse("Internal server error", error), 500);
		}
	}
}
