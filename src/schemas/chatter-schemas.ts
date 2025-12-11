import { z } from "zod";

// ============================================================================
// CLIENT REQUEST SCHEMAS
// ============================================================================

export const LocationHintSchema = z.object({
	lat: z.number(),
	lng: z.number(),
	accuracy_m: z.number().optional(),
});

export const PlaceInputSchema = z.object({
	name: z.string().optional(),
	formatted_address: z.string().optional(),
	short_address: z.string().optional(),
	location: z.object({
		lat: z.number(),
		lng: z.number(),
	}).optional(),
	provider_ids: z.record(z.string()).optional(),
}).refine(
	(data) => {
		// Must provide EITHER a Place ID OR all manual fields
		const hasPlaceId = data.provider_ids?.google_places;
		const hasManualFields = data.name && data.formatted_address && data.short_address && data.location;
		return hasPlaceId || hasManualFields;
	},
	{
		message: "Must provide either provider_ids.google_places OR all manual fields (name, formatted_address, short_address, location)",
	}
);

export const LinkSchema = z.object({
	url: z.string().url().describe("Full URL"),
	title: z.string().optional().describe("Page title from OpenGraph/meta tags"),
	description: z.string().optional().describe("Page description"),
	image: z.string().url().optional().describe("Preview image URL (og:image)"),
	domain: z.string().optional().describe("Domain name (e.g., twitter.com)"),
});

/**
 * Flexible link input schema - accepts:
 * - Single URL string: "https://example.com"
 * - Array of URL strings: ["https://ex1.com", "https://ex2.com"]
 * - Array of link objects: [{url: "https://example.com"}]
 */
export const FlexibleLinksSchema = z.union([
	z.string().url(),           // Single URL string
	z.array(z.string().url()),  // Array of URL strings
	z.array(LinkSchema),        // Array of link objects (current format)
]).optional();

/**
 * Normalize links from any supported format to array of link objects
 */
function normalizeLinks(
	input: string | string[] | Array<{ url: string; [key: string]: any }>
): Array<{ url: string; [key: string]: any }> {
	// Single string -> wrap in array and convert to object
	if (typeof input === "string") {
		return [{ url: input }];
	}

	// Array of strings -> convert each to object
	if (Array.isArray(input) && input.length > 0 && typeof input[0] === "string") {
		return input.map((url) => ({ url }));
	}

	// Array of objects -> already correct format
	return input as Array<{ url: string; [key: string]: any }>;
}

export const WatchedInputSchema = z.object({
	media_type: z.enum(["movie", "tv"]).describe("Type of media (movie or TV show)"),
	tmdb_id: z.number().optional().describe("The Movie Database ID (provide this OR tmdb_title)"),
	tmdb_title: z.string().optional().describe("Title to search on TMDB (provide this OR tmdb_id)"),
});

export const CreateChatterRequestSchema = z.object({
	kind: z.literal("chatter"),
	content: z.string().optional(),
	comment: z.string().optional().describe("Private comment/note about this chatter"),
	title: z.string().optional(),
	tags: z.array(z.string()).optional(),
	images: z
		.array(z.string())
		.optional()
		.describe("Array of R2 object keys (e.g., ['images/sha_abc123.jpg']) from image upload endpoint"),
	links: FlexibleLinksSchema.describe("URLs in flexible format: single string, array of strings, or array of objects"),
	publish: z.boolean().optional(),
	location_hint: LocationHintSchema.optional(),
	place: PlaceInputSchema.optional(),
	watched: WatchedInputSchema.optional().describe("Movie or TV show watched"),
}).transform((data) => {
	// Normalize links to array of objects format
	if (data.links) {
		data.links = normalizeLinks(data.links);
	}
	return data;
});

// ============================================================================
// PROVIDER & SNAPSHOT SCHEMAS
// ============================================================================

export const ProviderInfoSchema = z.object({
	name: z.string(),
	product: z.string(),
	version: z.string().optional(),
});

export function ApiSnapshotSchema<T extends z.ZodTypeAny>(summarySchema: T) {
	return z.object({
		captured_at: z.string().datetime(),
		provider: ProviderInfoSchema,
		summary: summarySchema,
	});
}

// ============================================================================
// SUMMARY SCHEMAS (normalized data)
// ============================================================================

export const WeatherSummarySchema = z.object({
	// Current conditions (from Google Weather API)
	temp_f: z.number().optional(),
	temp_feels_f: z.number().optional(),
	condition_code: z.string().optional(),
	condition_text: z.string().optional(),
	is_daytime: z.boolean().optional(),
	humidity_pct: z.number().optional(),
	pressure_inhg: z.number().optional(),
	wind_speed_mph: z.number().optional(),
	wind_gust_mph: z.number().optional(),
	wind_dir_deg: z.number().optional(),
	precip_in_last_1h: z.number().optional(),
	precip_chance_pct: z.number().optional(),
	cloud_pct: z.number().optional(),
	visibility_miles: z.number().optional(),
	uv_index: z.number().optional(),

	// Daily summary (from Open-Meteo Historical or aggregated from Google)
	temp_f_max: z.number().optional().describe("Maximum temperature (Fahrenheit)"),
	temp_f_min: z.number().optional().describe("Minimum temperature (Fahrenheit)"),
	temp_f_mean: z.number().optional().describe("Mean temperature (Fahrenheit)"),
	weather_code: z.number().optional().describe("WMO weather code (0-99)"),
	precipitation_sum: z.number().optional().describe("Total precipitation in inches"),
	wind_speed_mph_max: z.number().optional().describe("Maximum wind speed (mph)"),
	sunrise: z.string().optional().describe("Sunrise time (ISO 8601)"),
	sunset: z.string().optional().describe("Sunset time (ISO 8601)"),
	daylight_duration_hours: z.number().optional().describe("Daylight duration in hours"),

	// Source indicator
	is_historical: z.boolean().optional().describe("True if from historical weather API"),
});

export const AirQualitySummarySchema = z.object({
	aqi: z.number().optional(),
	aqi_scale: z.string().optional(),
	aqi_category: z.string().optional(),
	dominant_pollutant: z.string().optional(),
	pm25_ugm3: z.number().optional(),
	pm10_ugm3: z.number().optional(),
	o3_ppb: z.number().nullable().optional(),
	no2_ppb: z.number().nullable().optional(),
	so2_ppb: z.number().nullable().optional(),
	co_ppm: z.number().nullable().optional(),
});

export const PollenSummarySchema = z.object({
	date: z.string().optional(),
	index_overall: z.number().optional(),
	index_category: z.string().optional(),
	tree_index: z.number().nullable().optional(),
	tree_category: z.string().nullable().optional(),
	grass_index: z.number().nullable().optional(),
	grass_category: z.string().nullable().optional(),
	weed_index: z.number().nullable().optional(),
	weed_category: z.string().nullable().optional(),
});

export const PlaceSummarySchema = z.object({
	name: z.string(),
	formatted_address: z.string(),
	short_address: z.string().optional(),
	lat: z.number(),
	lng: z.number(),
	place_id: z.string().optional(),
	maps_url: z.string().optional(),
	website_url: z.string().nullable().optional(),
	phone: z.string().nullable().optional(),
	types: z.array(z.string()).optional(),
	rating: z.number().nullable().optional(),
	user_rating_count: z.number().nullable().optional(),
	price_level: z.number().nullable().optional(),
	provider_ids: z.record(z.string()).optional(),
});

export const GeocodingSummarySchema = z.object({
	lat: z.number(),
	lng: z.number(),
	formatted_address: z.string(),
	country_code: z.string().optional(),
	country_name: z.string().optional(),
	region_code: z.string().optional(),
	region_name: z.string().optional(),
	locality: z.string().optional(),
	postal_code: z.string().optional(),
	neighborhood: z.string().nullable().optional(),
	street_name: z.string().nullable().optional(),
	street_number: z.string().nullable().optional(),
});

export const ElevationSummarySchema = z.object({
	lat: z.number(),
	lng: z.number(),
	elevation_ft: z.number(),
});

export const NearbyPlaceSummarySchema = z.object({
	name: z.string(),
	formatted_address: z.string(),
	short_address: z.string().optional(),
	lat: z.number(),
	lng: z.number(),
	distance_m: z.number(),
	place_id: z.string().nullable().optional(),
	maps_url: z.string().nullable().optional(),
	types: z.array(z.string()).optional(),
});

export const NearbyPlacesSummarySchema = z.object({
	lat: z.number(),
	lng: z.number(),
	radius_m: z.number(),
	places: z.array(NearbyPlaceSummarySchema),
});

export const MediaSummarySchema = z.object({
	media_type: z.enum(["movie", "tv"]).describe("Type of media"),
	tmdb_id: z.number().describe("The Movie Database ID"),
	title: z.string().describe("Title (movie title or TV show name)"),
	release_date: z.string().optional().describe("Release date (YYYY-MM-DD)"),
	overview: z.string().optional().describe("Plot summary"),
	poster_url: z.string().optional().describe("Poster image URL"),
	backdrop_url: z.string().optional().describe("Backdrop image URL"),
	genres: z.array(z.string()).optional().describe("List of genres"),
	tmdb_rating: z.number().optional().describe("TMDB average rating (0-10)"),
	vote_count: z.number().optional().describe("Number of votes on TMDB"),
	tmdb_url: z.string().describe("URL to TMDB page"),
	// Movie-specific fields
	runtime: z.number().optional().describe("Runtime in minutes (movies only)"),
	director: z.string().optional().describe("Director name (movies only)"),
	// TV-specific fields
	number_of_seasons: z.number().optional().describe("Number of seasons (TV only)"),
	number_of_episodes: z.number().optional().describe("Total episodes (TV only)"),
	creators: z.array(z.string()).optional().describe("Creator names (TV only)"),
	// Common fields
	cast: z.array(z.string()).optional().describe("Main cast member names"),
});

// ============================================================================
// SPECIALIZED SNAPSHOT SCHEMAS
// ============================================================================

export const ApiSnapshot_WeatherSchema = ApiSnapshotSchema(WeatherSummarySchema);
export const ApiSnapshot_AirQualitySchema = ApiSnapshotSchema(AirQualitySummarySchema);
export const ApiSnapshot_PollenSchema = ApiSnapshotSchema(PollenSummarySchema);
export const ApiSnapshot_PlaceSchema = ApiSnapshotSchema(PlaceSummarySchema);
export const ApiSnapshot_GeocodingSchema = ApiSnapshotSchema(GeocodingSummarySchema);
export const ApiSnapshot_ElevationSchema = ApiSnapshotSchema(ElevationSummarySchema);
export const ApiSnapshot_NearbyPlacesSchema = ApiSnapshotSchema(NearbyPlacesSummarySchema);
export const ApiSnapshot_MediaSchema = ApiSnapshotSchema(MediaSummarySchema);

// ============================================================================
// ENVIRONMENT WRAPPER
// ============================================================================

export const EnvironmentSchema = z.object({
	geocoding: ApiSnapshot_GeocodingSchema.optional(),
	elevation: ApiSnapshot_ElevationSchema.optional(),
	weather: ApiSnapshot_WeatherSchema.optional(),
	air_quality: ApiSnapshot_AirQualitySchema.optional(),
	pollen: ApiSnapshot_PollenSchema.optional(),
	nearby_places: ApiSnapshot_NearbyPlacesSchema.optional(),
});

// ============================================================================
// CHATTER DATA (inner payload)
// ============================================================================

/**
 * Location Coordinate Usage:
 * - location_hint.lat/lng: Device GPS coordinates (where the user physically is)
 * - place.location.lat/lng: Selected venue coordinates (what they're posting about)
 * - environment.geocoding.lat/lng: Reverse geocoded address lookup coordinates
 * - environment.elevation.lat/lng: Elevation lookup coordinates
 */
export const ChatterDataSchema = z.object({
	kind: z.literal("chatter"),
	content: z.string().optional(),
	comment: z.string().optional().describe("Private comment/note about this chatter"),
	title: z.string().optional(),
	tags: z.array(z.string()).optional(),
	images: z
		.array(z.string())
		.optional()
		.describe("Array of R2 object keys (e.g., ['images/sha_abc123.jpg']) from image upload endpoint"),
	links: z.array(LinkSchema).optional().describe("URLs referenced in this chatter with metadata"),
	publish: z.boolean().optional(),
	location_hint: LocationHintSchema.optional(),
	place: PlaceInputSchema.optional(),
	environment: EnvironmentSchema.optional(),
	watched: ApiSnapshot_MediaSchema.optional().describe("Movie or TV show watched (enriched with TMDB data)"),
});

// ============================================================================
// CHATTER (complete storage format)
// ============================================================================

export const ChatterSchema = z.object({
	type: z.literal("chatter"),
	id: z.string(),
	schema_version: z.string().optional(),
	created_at: z.string().datetime().describe("When the chatter was created"),
	created_by: z.string().describe("User ID who created the chatter"),
	data: ChatterDataSchema,
});
