import { Bool, OpenAPIRoute } from "chanfana";
import type { Context } from "hono";
import { z } from "zod";
import { reindex } from "../services/admin";

export class AdminReindexEndpoint extends OpenAPIRoute {
	schema = {
		tags: ["admin"],
		summary: "Run reindex operation",
		responses: {
			"200": {
				description: "Reindex completed successfully",
				content: {
					"application/json": {
						schema: z.object({
							ok: Bool(),
						}),
					},
				},
			},
		},
	};

	async handle(c: Context<{ Bindings: Env }>) {
		await reindex(c.env);
		return c.json({ ok: true });
	}
}
