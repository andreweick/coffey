import type { ApiSnapshot_NearbyPlaces } from "../../types/chatter";
import { extractShortAddress } from "./google-places-utils";

/**
 * Point of interest types for filtering nearby places
 * Using Google Places API (New) v1 valid types
 * https://developers.google.com/maps/documentation/places/web-service/place-types
 */
const POI_TYPES = [
	"tourist_attraction",
	"museum",
	"art_gallery",
	"park",
	"amusement_park",
	"aquarium",
	"zoo",
	"restaurant",
	"cafe",
	"bar",
	"shopping_mall",
	"store",
	"movie_theater",
	"performing_arts_theater",
	"night_club",
	"casino",
	"stadium",
	"church",
	"hindu_temple",
	"mosque",
	"synagogue",
];

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in meters
 */
function calculateDistance(
	lat1: number,
	lng1: number,
	lat2: number,
	lng2: number
): number {
	const R = 6371e3; // Earth's radius in meters
	const φ1 = (lat1 * Math.PI) / 180;
	const φ2 = (lat2 * Math.PI) / 180;
	const Δφ = ((lat2 - lat1) * Math.PI) / 180;
	const Δλ = ((lng2 - lng1) * Math.PI) / 180;

	const a =
		Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
		Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

	return R * c; // Distance in meters
}

/**
 * Fetch nearby points of interest using Google Places API (New) v1
 *
 * @param lat - Latitude of the search center
 * @param lng - Longitude of the search center
 * @param env - Environment bindings
 * @param radius - Search radius in meters (default: 300)
 * @returns Up to 20 nearby places sorted by popularity
 */
export async function fetchNearbyPlaces(
	lat: number,
	lng: number,
	env: Env,
	radius: number = 300
): Promise<ApiSnapshot_NearbyPlaces> {
	const apiKey = await env.GOOGLE_PLACES_API.get();
	if (!apiKey) {
		throw new Error("GOOGLE_PLACES_API not configured");
	}

	const url = "https://places.googleapis.com/v1/places:searchNearby";

	const response = await fetch(url, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"X-Goog-Api-Key": apiKey,
			"X-Goog-FieldMask":
				"places.id,places.displayName,places.formattedAddress,places.location,places.types",
		},
		body: JSON.stringify({
			locationRestriction: {
				circle: {
					center: {
						latitude: lat,
						longitude: lng,
					},
					radius: radius,
				},
			},
			includedTypes: POI_TYPES,
			maxResultCount: 20,
			rankPreference: "POPULARITY",
		}),
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(
			`Google Places Nearby API error: ${response.status} - ${errorText}`
		);
	}

	const data = await response.json();

	// Transform places to normalized format
	const places =
		data.places?.map((place: any) => {
			const placeLat = place.location?.latitude || 0;
			const placeLng = place.location?.longitude || 0;
			const distance = calculateDistance(lat, lng, placeLat, placeLng);

			return {
				name: place.displayName?.text || "Unknown Place",
				formatted_address: place.formattedAddress || "",
				short_address: extractShortAddress(place.formattedAddress || ""),
				lat: placeLat,
				lng: placeLng,
				distance_m: Math.round(distance),
				place_id: place.id || null,
				maps_url: place.id
					? `https://www.google.com/maps/place/?q=place_id:${place.id}`
					: null,
				types: place.types || [],
			};
		}) || [];

	return {
		captured_at: new Date().toISOString(),
		provider: {
			name: "google",
			product: "places-nearby",
			version: "v1",
		},
		summary: {
			lat,
			lng,
			radius_m: radius,
			places,
		},
	};
}
