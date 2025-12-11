import { z } from "zod";
import {
	LocationHintSchema,
	PlaceInputSchema,
	LinkSchema,
	WatchedInputSchema,
	CreateChatterRequestSchema,
	ProviderInfoSchema,
	WeatherSummarySchema,
	AirQualitySummarySchema,
	PollenSummarySchema,
	PlaceSummarySchema,
	GeocodingSummarySchema,
	ElevationSummarySchema,
	NearbyPlaceSummarySchema,
	NearbyPlacesSummarySchema,
	MediaSummarySchema,
	ApiSnapshot_WeatherSchema,
	ApiSnapshot_AirQualitySchema,
	ApiSnapshot_PollenSchema,
	ApiSnapshot_PlaceSchema,
	ApiSnapshot_GeocodingSchema,
	ApiSnapshot_ElevationSchema,
	ApiSnapshot_NearbyPlacesSchema,
	ApiSnapshot_MediaSchema,
	EnvironmentSchema,
	ChatterDataSchema,
	ChatterSchema,
} from "../schemas/chatter-schemas";

// ============================================================================
// INFERRED TYPESCRIPT TYPES FROM ZOD SCHEMAS
// ============================================================================

export type LocationHint = z.infer<typeof LocationHintSchema>;
export type PlaceInput = z.infer<typeof PlaceInputSchema>;
export type Link = z.infer<typeof LinkSchema>;
export type WatchedInput = z.infer<typeof WatchedInputSchema>;
export type CreateChatterRequest = z.infer<typeof CreateChatterRequestSchema>;

export type ProviderInfo = z.infer<typeof ProviderInfoSchema>;

export type WeatherSummary = z.infer<typeof WeatherSummarySchema>;
export type AirQualitySummary = z.infer<typeof AirQualitySummarySchema>;
export type PollenSummary = z.infer<typeof PollenSummarySchema>;
export type PlaceSummary = z.infer<typeof PlaceSummarySchema>;
export type GeocodingSummary = z.infer<typeof GeocodingSummarySchema>;
export type ElevationSummary = z.infer<typeof ElevationSummarySchema>;
export type NearbyPlaceSummary = z.infer<typeof NearbyPlaceSummarySchema>;
export type NearbyPlacesSummary = z.infer<typeof NearbyPlacesSummarySchema>;
export type MediaSummary = z.infer<typeof MediaSummarySchema>;

export type ApiSnapshot_Weather = z.infer<typeof ApiSnapshot_WeatherSchema>;
export type ApiSnapshot_AirQuality = z.infer<typeof ApiSnapshot_AirQualitySchema>;
export type ApiSnapshot_Pollen = z.infer<typeof ApiSnapshot_PollenSchema>;
export type ApiSnapshot_Place = z.infer<typeof ApiSnapshot_PlaceSchema>;
export type ApiSnapshot_Geocoding = z.infer<typeof ApiSnapshot_GeocodingSchema>;
export type ApiSnapshot_Elevation = z.infer<typeof ApiSnapshot_ElevationSchema>;
export type ApiSnapshot_NearbyPlaces = z.infer<typeof ApiSnapshot_NearbyPlacesSchema>;
export type ApiSnapshot_Media = z.infer<typeof ApiSnapshot_MediaSchema>;

export type Environment = z.infer<typeof EnvironmentSchema>;
export type ChatterData = z.infer<typeof ChatterDataSchema>;
export type Chatter = z.infer<typeof ChatterSchema>;
