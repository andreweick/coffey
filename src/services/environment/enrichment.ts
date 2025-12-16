import type { CreateChatterRequest, ChatterData, Environment } from "../../types/chatter";
import { fetchPlaceDetails, reverseGeocodeFull } from "./google-places";
import { fetchWeather } from "./weather-unified";
import { fetchAirQuality } from "./google-air-quality";
import { fetchPollen } from "./google-pollen";
import { fetchElevation } from "./google-elevation";
import { fetchNearbyPlaces } from "./google-places-nearby";
import { enrichLinks } from "../link-preview";
import { searchMovie, searchTv, fetchMovieDetails, fetchTvDetails } from "../tmdb/tmdb-api";
import { getErrorMessage } from "../../lib/errors";

/**
 * Helper to assign fulfilled promise results to environment object
 * Only assigns non-null values (null values are skipped, e.g., future dates for weather)
 */
function assignIfFulfilled<T>(
	result: PromiseSettledResult<T>,
	environment: Environment,
	key: keyof Environment,
	errorMessage: string
): void {
	if (result.status === "fulfilled") {
		// Only assign if value is not null (null = intentional skip, e.g., future date)
		if (result.value !== null && result.value !== undefined) {
			// @ts-ignore - We know the value type matches the key
			environment[key] = result.value;
		}
	} else {
		console.error(errorMessage, result.reason);
	}
}

/**
 * Enrich a chatter with environmental data
 * Coordinates all environmental data fetching in parallel
 */
export async function enrichChatter(
	request: CreateChatterRequest,
	env: Env
): Promise<ChatterData> {
	// If Place ID is provided but manual fields are missing, fetch place details early
	if (request.place?.provider_ids?.google_places && !request.place.name) {
		try {
			const placeSnapshot = await fetchPlaceDetails(
				request.place.provider_ids.google_places,
				env
			);
			// Populate place with fetched data
			request.place = {
				name: placeSnapshot.summary.name,
				formatted_address: placeSnapshot.summary.formatted_address,
				short_address: placeSnapshot.summary.short_address || placeSnapshot.summary.name,
				location: {
					lat: placeSnapshot.summary.lat,
					lng: placeSnapshot.summary.lng,
				},
				provider_ids: request.place.provider_ids,
			};
		} catch (error) {
			console.error("Early place details fetch failed:", error);
			throw new Error(`Failed to fetch place details for Place ID: ${getErrorMessage(error)}`);
		}
	}

	// Extract coordinates from location_hint or place
	const coords = extractCoordinates(request);

	// Build base chatter data
	const chatterData: ChatterData = {
		kind: request.kind,
		content: request.content,
		comment: request.comment,
		title: request.title,
		tags: request.tags || [],
		images: request.images || [],
		publish: request.publish !== undefined ? request.publish : true,
		location_hint: request.location_hint,
		place: request.place,
	};

	// Enrich links with metadata if provided
	if (request.links && request.links.length > 0) {
		try {
			chatterData.links = await enrichLinks(request.links);
		} catch (error) {
			console.error("Link enrichment failed:", error);
			// Use original links if enrichment fails
			chatterData.links = request.links;
		}
	}

	// Enrich watched movie/TV data from TMDB if provided
	if (request.watched) {
		try {
			let tmdbId = request.watched.tmdb_id;

			// If title provided instead of ID, search TMDB first
			if (!tmdbId && request.watched.tmdb_title) {
				const searchFn = request.watched.media_type === "movie" ? searchMovie : searchTv;
				const result = await searchFn(request.watched.tmdb_title, env);
				tmdbId = result.id;
			}

			if (tmdbId) {
				const fetchFn = request.watched.media_type === "movie"
					? fetchMovieDetails
					: fetchTvDetails;
				chatterData.watched = await fetchFn(tmdbId, env);
			}
		} catch (error) {
			console.error("TMDB enrichment failed:", error);
			// Continue without watched data if enrichment fails
		}
	}

	// If no coordinates available, return chatter without environmental data
	if (!coords) {
		return chatterData;
	}

	// Use created_at timestamp if provided, otherwise use current timestamp
	// Pass full datetime (not just date) to weather API for accurate hourly data
	const targetDateTime = request.created_at || new Date().toISOString();

	// Fetch all environmental data in parallel
	// Use Promise.allSettled to handle partial failures gracefully
	const [weatherResult, airQualityResult, pollenResult, elevationResult, geocodingResult, nearbyPlacesResult] =
		await Promise.allSettled([
			fetchWeather(coords.lat, coords.lng, targetDateTime, env),
			fetchAirQuality(coords.lat, coords.lng, env),
			fetchPollen(coords.lat, coords.lng, env),
			fetchElevation(coords.lat, coords.lng, env),
			reverseGeocodeFull(coords.lat, coords.lng, env),
			fetchNearbyPlaces(coords.lat, coords.lng, env, 500),
		]);

	// Build environment object with successful results
	const environment: Environment = {};

	assignIfFulfilled(weatherResult, environment, "weather", "Weather fetch failed:");
	assignIfFulfilled(airQualityResult, environment, "air_quality", "Air quality fetch failed:");
	assignIfFulfilled(pollenResult, environment, "pollen", "Pollen fetch failed:");
	assignIfFulfilled(elevationResult, environment, "elevation", "Elevation fetch failed:");
	assignIfFulfilled(geocodingResult, environment, "geocoding", "Geocoding fetch failed:");
	assignIfFulfilled(nearbyPlacesResult, environment, "nearby_places", "Nearby places fetch failed:");

	// If place was provided, fetch full place details
	if (request.place?.provider_ids?.google_places) {
		try {
			const placeSnapshot = await fetchPlaceDetails(
				request.place.provider_ids.google_places,
				env
			);
			environment.place = placeSnapshot;
		} catch (error) {
			console.error("Place details fetch failed:", error);
			// Continue without place details
		}
	}

	// Add environment to chatter data
	chatterData.environment = environment;

	return chatterData;
}

/**
 * Extract coordinates from request (location_hint or place)
 */
function extractCoordinates(
	request: CreateChatterRequest
): { lat: number; lng: number } | null {
	if (request.location_hint) {
		return {
			lat: request.location_hint.lat,
			lng: request.location_hint.lng,
		};
	}

	if (request.place?.location) {
		return {
			lat: request.place.location.lat,
			lng: request.place.location.lng,
		};
	}

	return null;
}
