import type { NearbyPlace } from "../types/domain";

interface GooglePlaceResult {
	place_id: string;
	name: string;
	vicinity?: string;
	geometry: {
		location: {
			lat: number;
			lng: number;
		};
	};
	types?: string[];
}

interface GooglePlacesResponse {
	results: GooglePlaceResult[];
	status: string;
	error_message?: string;
}

export interface FetchNearbyPlacesParams {
	lat: number;
	lng: number;
	query?: string;
	radius?: number;
}

export async function fetchNearbyPlaces(
	env: Env,
	params: FetchNearbyPlacesParams
): Promise<NearbyPlace[]> {
	const { lat, lng, query, radius = 1500 } = params;
	const apiKey = env.GOOGLE_PLACES_API_KEY;

	if (!apiKey) {
		throw new Error("GOOGLE_PLACES_API_KEY is not configured");
	}

	const url = new URL("https://maps.googleapis.com/maps/api/place/nearbysearch/json");
	url.searchParams.set("location", `${lat},${lng}`);
	url.searchParams.set("radius", String(radius));
	url.searchParams.set("key", apiKey);

	if (query) {
		url.searchParams.set("keyword", query);
	}

	const response = await fetch(url.toString());
	const data = (await response.json()) as GooglePlacesResponse;

	if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
		throw new Error(`Google Places API error: ${data.status} - ${data.error_message ?? "Unknown error"}`);
	}

	return data.results.map((place) => ({
		placeId: place.place_id,
		name: place.name,
		address: place.vicinity,
		lat: place.geometry.location.lat,
		lng: place.geometry.location.lng,
		types: place.types,
	}));
}
