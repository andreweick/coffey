import type { NearbyPlace } from "../types/domain";

interface GooglePlaceResult {
	id: string;
	displayName?: {
		text: string;
	};
	formattedAddress?: string;
	location?: {
		latitude: number;
		longitude: number;
	};
	types?: string[];
}

interface GooglePlacesResponse {
	places: GooglePlaceResult[];
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
	const apiKey = await env.GOOGLE_PLACES_API.get();

	if (!apiKey) {
		throw new Error("GOOGLE_PLACES_API is not configured");
	}

	const url = "https://places.googleapis.com/v1/places:searchNearby";

	const requestBody: any = {
		locationRestriction: {
			circle: {
				center: {
					latitude: lat,
					longitude: lng,
				},
				radius: radius,
			},
		},
	};

	// If query is provided, use it as a text query
	if (query) {
		requestBody.textQuery = query;
	}

	const response = await fetch(url, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"X-Goog-Api-Key": apiKey,
			"X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.location,places.types",
		},
		body: JSON.stringify(requestBody),
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`Google Places API error: ${response.status} - ${errorText}`);
	}

	const data = (await response.json()) as GooglePlacesResponse;

	if (!data.places) {
		return [];
	}

	return data.places.map((place) => ({
		placeId: place.id,
		name: place.displayName?.text || "Unknown",
		address: place.formattedAddress,
		lat: place.location?.latitude || 0,
		lng: place.location?.longitude || 0,
		types: place.types,
	}));
}
