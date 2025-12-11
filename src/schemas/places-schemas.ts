import { Num, Str } from "chanfana";
import { z } from "zod";

/**
 * Query parameters for nearby places search
 */
export const NearbyPlacesQuerySchema = z.object({
	lat: Num({ description: "Latitude", required: true }),
	lng: Num({ description: "Longitude", required: true }),
	q: Str({ description: "Search query/keyword", required: false }),
	radius: Num({
		description: "Search radius in meters",
		required: false,
		default: 1500,
	}),
});

/**
 * Schema for a single nearby place
 */
export const NearbyPlaceSchema = z.object({
	placeId: z.string().describe("Google Places ID"),
	name: z.string().describe("Place name"),
	address: z.string().optional().describe("Formatted address"),
	lat: z.number().describe("Latitude"),
	lng: z.number().describe("Longitude"),
	types: z.array(z.string()).optional().describe("Place types (e.g., restaurant, cafe)"),
});

/**
 * Response schema for nearby places search
 */
export const NearbyPlacesResponseSchema = z.object({
	results: z.array(NearbyPlaceSchema).describe("Array of nearby places"),
});

export type NearbyPlacesQuery = z.infer<typeof NearbyPlacesQuerySchema>;
export type NearbyPlace = z.infer<typeof NearbyPlaceSchema>;
export type NearbyPlacesResponse = z.infer<typeof NearbyPlacesResponseSchema>;
