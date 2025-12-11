export interface GeocodeCityState {
	city: string;
	state: string;
	country: string;
	formatted: string;
}

interface AddressComponent {
	long_name: string;
	short_name: string;
	types: string[];
}

interface GeocodeResult {
	formatted_address: string;
	address_components: AddressComponent[];
}

interface GoogleGeocodeResponse {
	results: GeocodeResult[];
	status: string;
	error_message?: string;
}

export async function reverseGeocode(
	env: Env,
	lat: number,
	lng: number
): Promise<GeocodeCityState> {
	const apiKey = await env.GOOGLE_PLACES_API.get();

	if (!apiKey) {
		throw new Error("GOOGLE_PLACES_API is not configured");
	}

	const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;

	const response = await fetch(url);
	const data = (await response.json()) as GoogleGeocodeResponse;

	if (data.status !== "OK") {
		throw new Error(`Google Geocoding API error: ${data.status} - ${data.error_message ?? "Unknown error"}`);
	}

	if (!data.results || data.results.length === 0) {
		throw new Error("No geocoding results found");
	}

	const result = data.results[0];
	const components = result.address_components || [];

	// Extract city, state, country
	let city = "";
	let state = "";
	let country = "";

	for (const component of components) {
		if (component.types.includes("locality")) {
			city = component.long_name;
		} else if (component.types.includes("administrative_area_level_1")) {
			state = component.short_name;
		} else if (component.types.includes("country")) {
			country = component.long_name;
		}
	}

	// Fallback: try sublocality or neighborhood for city
	if (!city) {
		for (const component of components) {
			if (component.types.includes("sublocality") || component.types.includes("neighborhood")) {
				city = component.long_name;
				break;
			}
		}
	}

	const formatted = `${city}${city && state ? ", " : ""}${state}`;

	return {
		city,
		state,
		country,
		formatted,
	};
}
