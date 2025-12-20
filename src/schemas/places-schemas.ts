import { Num, Str } from "chanfana";
import { z } from "zod";

/**
 * Valid place types for filtering nearby search
 * https://developers.google.com/maps/documentation/places/web-service/place-types
 */
export const PLACE_TYPES = [
	"restaurant",
	"cafe",
	"bar",
	"coffee_shop",
	"bakery",
	"food",
	"meal_delivery",
	"meal_takeaway",
	"store",
	"shopping_mall",
	"supermarket",
	"convenience_store",
	"clothing_store",
	"book_store",
	"museum",
	"art_gallery",
	"tourist_attraction",
	"park",
	"gym",
	"spa",
	"beauty_salon",
	"hair_care",
	"library",
	"movie_theater",
	"night_club",
	"stadium",
	"church",
	"hindu_temple",
	"mosque",
	"synagogue",
	"hotel",
	"lodging",
	"airport",
	"train_station",
	"bus_station",
	"subway_station",
	"hospital",
	"pharmacy",
	"doctor",
	"dentist",
] as const;

/**
 * TypeScript type for valid place types
 */
export type PlaceType = typeof PLACE_TYPES[number];

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
		default: 500,
	}),
	types: Str({
		description: "Comma-separated place types to filter (e.g., 'restaurant,cafe'). See Google Places API types.",
		required: false,
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

/**
 * Response schema for place types list
 */
export const PlaceTypesResponseSchema = z.object({
	types: z.array(z.string()).describe("Array of valid place type strings"),
});

export type NearbyPlacesQuery = z.infer<typeof NearbyPlacesQuerySchema>;
export type NearbyPlace = z.infer<typeof NearbyPlaceSchema>;
export type NearbyPlacesResponse = z.infer<typeof NearbyPlacesResponseSchema>;
export type PlaceTypesResponse = z.infer<typeof PlaceTypesResponseSchema>;
