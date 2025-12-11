import type { ApiSnapshot_Weather } from "../../types/chatter";
import { fetchWeather as fetchGoogleWeather } from "./google-weather";
import { fetchHistoricalWeather, parseExifDate } from "./openmeteo-historical";

/**
 * Fetch weather data using the most appropriate API based on the date
 * - If date is today: Use Google Weather API (current, accurate)
 * - If date is in the past: Use Open-Meteo Historical API
 *
 * @param lat - Latitude
 * @param lng - Longitude
 * @param date - Date in YYYY-MM-DD format or EXIF format (YYYY:MM:DD HH:MM:SS)
 * @param env - Environment bindings (for Google API key)
 * @returns Weather snapshot with unified format
 */
export async function fetchWeather(
	lat: number,
	lng: number,
	date: string,
	env: Env
): Promise<ApiSnapshot_Weather> {
	// Parse date if it's in EXIF format (YYYY:MM:DD HH:MM:SS)
	const normalizedDate = date.includes(":")
		? parseExifDate(date)
		: date;

	// Get today's date in YYYY-MM-DD format
	const today = new Date().toISOString().split("T")[0];

	// If date is today, use Google Weather (current conditions, more accurate)
	if (normalizedDate === today) {
		return fetchGoogleWeather(lat, lng, env);
	}

	// Otherwise use Open-Meteo (historical data)
	return fetchHistoricalWeather(lat, lng, normalizedDate);
}
