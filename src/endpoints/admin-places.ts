import { OpenAPIRoute } from "chanfana";
import type { Context } from "hono";
import { standardErrorResponses } from "../schemas/common";
import {
	NearbyPlacesQuerySchema,
	NearbyPlacesResponseSchema,
} from "../schemas/places-schemas";
import { fetchNearbyPlaces } from "../services/places";

export class AdminNearbyPlacesEndpoint extends OpenAPIRoute {
	schema = {
		tags: ["admin"],
		summary: "Get nearby places using Google Places (admin only)",
		request: {
			query: NearbyPlacesQuerySchema,
		},
		responses: {
			"200": {
				description: "List of nearby places",
				content: {
					"application/json": {
						schema: NearbyPlacesResponseSchema,
					},
				},
			},
			...standardErrorResponses,
		},
	};

	async handle(c: Context<{ Bindings: Env }>) {
		const data = await this.getValidatedData<typeof this.schema>();
		const { lat, lng, q, radius, types } = data.query;

		// Parse comma-separated types into array
		const typesArray = types ? types.split(',').map(t => t.trim()).filter(Boolean) : undefined;

		const results = await fetchNearbyPlaces(c.env, {
			lat,
			lng,
			query: q,
			radius,
			types: typesArray,
		});

		return c.json({ results });
	}
}
