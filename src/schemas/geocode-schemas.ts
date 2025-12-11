import { Num } from "chanfana";
import { z } from "zod";

/**
 * Query parameters for reverse geocoding
 */
export const GeocodeQuerySchema = z.object({
	lat: Num({ description: "Latitude", required: true }),
	lng: Num({ description: "Longitude", required: true }),
});

/**
 * Response schema for reverse geocoding
 */
export const GeocodeCityStateSchema = z.object({
	city: z.string().describe("City name"),
	state: z.string().describe("State/region name"),
	country: z.string().describe("Country name"),
	formatted: z.string().describe("Formatted address (e.g., 'San Francisco, CA')"),
});

export type GeocodeQuery = z.infer<typeof GeocodeQuerySchema>;
export type GeocodeCityState = z.infer<typeof GeocodeCityStateSchema>;
