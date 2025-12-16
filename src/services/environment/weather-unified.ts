import type { ApiSnapshot_Weather } from "../../types/chatter";
import { fetchWeather as fetchGoogleWeather } from "./google-weather";
import { fetchHourlyWeather } from "./google-weather-hourly";
import { fetchHistoricalWeather, parseExifDate } from "./openmeteo-historical";

/**
 * Parse a date string (EXIF or ISO format) into a Date object
 * EXIF dates don't have timezone info, so we treat them as UTC for consistency
 * @param dateStr - Date in YYYY-MM-DD, YYYY-MM-DD HH:MM:SS, or EXIF format (YYYY:MM:DD HH:MM:SS)
 * @returns Date object or null if invalid
 */
function parseDateTime(dateStr: string): Date | null {
	// Normalize EXIF format (YYYY:MM:DD) to ISO format (YYYY-MM-DD)
	let normalized = dateStr.replace(/^(\d{4}):(\d{2}):(\d{2})/, "$1-$2-$3");

	// If it has time component but no timezone, treat as UTC by appending Z
	if (normalized.includes(" ") && !normalized.includes("Z")) {
		// Convert space to T for ISO format and append Z for UTC
		normalized = normalized.replace(" ", "T") + "Z";
	} else if (!normalized.includes("T") && !normalized.includes("Z")) {
		// Date only, treat as midnight UTC
		normalized = normalized + "T00:00:00Z";
	}

	const date = new Date(normalized);
	return isNaN(date.getTime()) ? null : date;
}

/**
 * Fetch weather data using the most appropriate API based on the date
 * - If date is in the future: Returns null (no weather data)
 * - If date is within 24 hours: Use Google Weather API (current conditions, valid for 24h)
 * - If date is 24+ hours old: Use Open-Meteo Historical API
 *
 * @param lat - Latitude
 * @param lng - Longitude
 * @param date - Date in YYYY-MM-DD format or EXIF format (YYYY:MM:DD HH:MM:SS)
 * @param env - Environment bindings (for Google API key)
 * @returns Weather snapshot with unified format, or null if date is invalid/future
 */
export async function fetchWeather(
	lat: number,
	lng: number,
	date: string,
	env: Env
): Promise<ApiSnapshot_Weather | null> {
	// Parse the datetime with full time component preserved
	const dateTime = parseDateTime(date);

	if (!dateTime) {
		console.warn(`Invalid date format: ${date}`);
		return null;
	}

	// Calculate hours difference from now
	const now = Date.now();
	const hoursDiff = (now - dateTime.getTime()) / (1000 * 60 * 60);

	// If date is in the future, don't fetch weather
	if (hoursDiff < 0) {
		return null;
	}

	// If less than 24 hours old, use Google Weather Hourly History
	// This gives us weather for the specific hour closest to the target datetime
	if (hoursDiff < 24) {
		return fetchHourlyWeather(lat, lng, dateTime, env);
	}

	// Otherwise use Open-Meteo (historical data)
	// Need to convert to YYYY-MM-DD format for the API
	const normalizedDate = date.includes(":")
		? parseExifDate(date)
		: date.split("T")[0]; // Remove time component if present

	return fetchHistoricalWeather(lat, lng, normalizedDate);
}
