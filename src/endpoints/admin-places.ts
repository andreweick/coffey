import { Num, OpenAPIRoute, Str } from "chanfana";
import type { Context } from "hono";
import { z } from "zod";
import { fetchNearbyPlaces } from "../services/places";

export class AdminNearbyPlacesEndpoint extends OpenAPIRoute {
	schema = {
		tags: ["admin"],
		summary: "Get nearby places using Google Places (admin only)",
		request: {
			query: z.object({
				lat: Num({ description: "Latitude", required: true }),
				lng: Num({ description: "Longitude", required: true }),
				q: Str({ description: "Search query/keyword", required: false }),
				radius: Num({ description: "Search radius in meters", required: false, default: 1500 }),
			}),
		},
		responses: {
			"200": {
				description: "List of nearby places",
				content: {
					"application/json": {
						schema: z.object({
							results: z.array(
								z.object({
									placeId: z.string(),
									name: z.string(),
									address: z.string().optional(),
									lat: z.number(),
									lng: z.number(),
									types: z.array(z.string()).optional(),
								})
							),
						}),
					},
				},
			},
		},
	};

	async handle(c: Context<{ Bindings: Env }>) {
		const data = await this.getValidatedData<typeof this.schema>();
		const { lat, lng, q, radius } = data.query;

		const results = await fetchNearbyPlaces(c.env, {
			lat,
			lng,
			query: q,
			radius,
		});

		return c.json({ results });
	}
}
