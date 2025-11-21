import { Bool, OpenAPIRoute } from "chanfana";
import type { Context } from "hono";
import { z } from "zod";
import { compactJsonl } from "../services/admin";

export class AdminCompactJsonlEndpoint extends OpenAPIRoute {
	schema = {
		tags: ["admin"],
		summary: "Compact JSONL files / perform maintenance",
		responses: {
			"200": {
				description: "Maintenance completed successfully",
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
		await compactJsonl(c.env);
		return c.json({ ok: true });
	}
}
