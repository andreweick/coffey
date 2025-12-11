import type { ApiSnapshot_Weather, WeatherSummary } from "../../types/chatter";

export async function fetchWeather(
	lat: number,
	lng: number,
	env: Env
): Promise<ApiSnapshot_Weather> {
	const apiKey = await env.GOOGLE_PLACES_API.get();
	if (!apiKey) {
		throw new Error("GOOGLE_PLACES_API not configured");
	}

	const url = `https://weather.googleapis.com/v1/currentConditions:lookup?location.latitude=${lat}&location.longitude=${lng}&key=${apiKey}`;

	const response = await fetch(url);

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`Google Weather API error: ${response.status} - ${errorText}`);
	}

	const data = await response.json();

	// Transform to normalized format
	const summary: WeatherSummary = {
		temp_f: data.temperature?.degrees,
		condition_text: data.weatherCondition?.description?.text,
		humidity_pct: data.relativeHumidity?.value,
		wind_speed_mph: data.wind?.speed?.value,
		wind_dir_deg: data.wind?.direction?.degrees,
		cloud_pct: data.cloudCover?.value,
		visibility_miles: data.visibility?.value,
		uv_index: data.uvIndex?.value,
	};

	return {
		captured_at: new Date().toISOString(),
		provider: {
			name: "google",
			product: "weather",
			version: "v1",
		},
		summary,
	};
}
