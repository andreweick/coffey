import { OpenAPIRoute } from "chanfana";
import type { Context } from "hono";
import { standardErrorResponses } from "../schemas/common";
import { GeocodeQuerySchema, GeocodeCityStateSchema } from "../schemas/geocode-schemas";
import { reverseGeocode } from "../services/geocode";

export class AdminGeocodeReverseEndpoint extends OpenAPIRoute {
	schema = {
		tags: ["admin"],
		summary: "Reverse geocode coordinates to city/state",
		request: {
			query: GeocodeQuerySchema,
		},
		responses: {
			"200": {
				description: "City and state information",
				content: {
					"application/json": {
						schema: GeocodeCityStateSchema,
					},
				},
			},
			...standardErrorResponses,
		},
	};

	async handle(c: Context<{ Bindings: Env }>) {
		const data = await this.getValidatedData<typeof this.schema>();
		const { lat, lng } = data.query;

		const result = await reverseGeocode(c.env, lat, lng);

		return c.json(result);
	}
}
