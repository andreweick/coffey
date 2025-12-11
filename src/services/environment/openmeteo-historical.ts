import type { ApiSnapshot_Weather, WeatherSummary } from "../../types/chatter";

// WMO Weather Code descriptions
// Source: https://www.nodc.noaa.gov/archive/arc0021/0002199/1.1/data/0-data/HTML/WMO-CODE/WMO4677.HTM
const WEATHER_CODES: Record<number, string> = {
	0: "Clear sky",
	1: "Mainly clear",
	2: "Partly cloudy",
	3: "Overcast",
	45: "Fog",
	48: "Depositing rime fog",
	51: "Light drizzle",
	53: "Moderate drizzle",
	55: "Dense drizzle",
	56: "Light freezing drizzle",
	57: "Dense freezing drizzle",
	61: "Slight rain",
	63: "Moderate rain",
	65: "Heavy rain",
	66: "Light freezing rain",
	67: "Heavy freezing rain",
	71: "Slight snow fall",
	73: "Moderate snow fall",
	75: "Heavy snow fall",
	77: "Snow grains",
	80: "Slight rain showers",
	81: "Moderate rain showers",
	82: "Violent rain showers",
	85: "Slight snow showers",
	86: "Heavy snow showers",
	95: "Thunderstorm",
	96: "Thunderstorm with slight hail",
	99: "Thunderstorm with heavy hail",
};

/**
 * Fetch historical weather data from Open-Meteo API
 * @param lat - Latitude
 * @param lng - Longitude
 * @param date - Date in YYYY-MM-DD format
 * @returns Weather snapshot with historical data
 */
export async function fetchHistoricalWeather(
	lat: number,
	lng: number,
	date: string
): Promise<ApiSnapshot_Weather> {
	const url = new URL("https://archive-api.open-meteo.com/v1/archive");

	url.searchParams.set("latitude", lat.toString());
	url.searchParams.set("longitude", lng.toString());
	url.searchParams.set("start_date", date);
	url.searchParams.set("end_date", date);
	url.searchParams.set("temperature_unit", "fahrenheit");
	url.searchParams.set("wind_speed_unit", "mph");
	url.searchParams.set("precipitation_unit", "inch");
	url.searchParams.set(
		"daily",
		[
			"temperature_2m_max",
			"temperature_2m_min",
			"temperature_2m_mean",
			"weather_code",
			"precipitation_sum",
			"wind_speed_10m_max",
			"sunrise",
			"sunset",
			"daylight_duration",
		].join(",")
	);

	const response = await fetch(url.toString());

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(
			`Open-Meteo API error: ${response.status} - ${errorText}`
		);
	}

	const data = await response.json();

	// Extract daily values (array with single element for single day)
	const daily = data.daily;
	const weatherCode = daily.weather_code?.[0];

	// Transform to normalized WeatherSummary format
	const summary: WeatherSummary = {
		// Daily summary fields
		temp_f_max: daily.temperature_2m_max?.[0],
		temp_f_min: daily.temperature_2m_min?.[0],
		temp_f_mean: daily.temperature_2m_mean?.[0],
		weather_code: weatherCode,
		condition_text:
			weatherCode !== undefined ? WEATHER_CODES[weatherCode] : undefined,
		precipitation_sum: daily.precipitation_sum?.[0],
		wind_speed_mph_max: daily.wind_speed_10m_max?.[0],
		sunrise: daily.sunrise?.[0],
		sunset: daily.sunset?.[0],
		daylight_duration_hours: daily.daylight_duration?.[0]
			? daily.daylight_duration[0] / 3600
			: undefined,

		// Mark as historical
		is_historical: true,
	};

	return {
		captured_at: new Date().toISOString(),
		provider: {
			name: "open-meteo",
			product: "archive",
			version: "v1",
		},
		summary,
	};
}

/**
 * Parse EXIF DateTimeOriginal to YYYY-MM-DD format
 * @param dateTimeOriginal - EXIF date string (format: "2024:11:28 14:30:45")
 * @returns Date in YYYY-MM-DD format
 */
export function parseExifDate(dateTimeOriginal: string): string {
	// EXIF format: "2024:11:28 14:30:45"
	// Extract date part and replace colons with dashes
	return dateTimeOriginal.substring(0, 10).replace(/:/g, "-");
}
