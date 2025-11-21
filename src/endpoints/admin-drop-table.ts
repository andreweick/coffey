import { Bool, OpenAPIRoute, Str } from "chanfana";
import type { Context } from "hono";
import { z } from "zod";
import { dropTable } from "../services/admin";

export class AdminDropTableEndpoint extends OpenAPIRoute {
	schema = {
		tags: ["admin"],
		summary: "Drop a table (restricted to safe tables)",
		request: {
			body: {
				content: {
					"application/json": {
						schema: z.object({
							tableName: Str({ description: "Name of the table to drop" }),
						}),
					},
				},
			},
		},
		responses: {
			"200": {
				description: "Table dropped successfully",
				content: {
					"application/json": {
						schema: z.object({
							ok: Bool(),
						}),
					},
				},
			},
			"400": {
				description: "Invalid table name",
				content: {
					"application/json": {
						schema: z.object({
							ok: Bool(),
							error: Str(),
						}),
					},
				},
			},
		},
	};

	async handle(c: Context<{ Bindings: Env }>) {
		const data = await this.getValidatedData<typeof this.schema>();
		const { tableName } = data.body;

		try {
			await dropTable(c.env, tableName);
			return c.json({ ok: true });
		} catch (err) {
			const message = err instanceof Error ? err.message : "Unknown error";
			return c.json({ ok: false, error: message }, 400);
		}
	}
}
