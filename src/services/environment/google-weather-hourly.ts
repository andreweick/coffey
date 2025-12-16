import type { ApiSnapshot_Weather, WeatherSummary } from "../../types/chatter";

/**
 * Convert Celsius to Fahrenheit
 */
function celsiusToFahrenheit(celsius: number): number {
	return (celsius * 9/5) + 32;
}

/**
 * Convert kilometers to miles
 */
function kilometersToMiles(km: number): number {
	return km * 0.621371;
}

/**
 * Convert millimeters to inches
 */
function millimetersToInches(mm: number): number {
	return mm * 0.0393701;
}

/**
 * Convert millibars to inches of mercury
 */
function millibarsToInchesHg(mb: number): number {
	return mb * 0.02953;
}

/**
 * Fetch hourly historical weather from Google Weather API
 * Returns weather for the hour closest to the target datetime
 *
 * @param lat - Latitude
 * @param lng - Longitude
 * @param targetDateTime - ISO 8601 datetime to find weather for
 * @param env - Environment bindings
 * @returns Weather snapshot for the closest hour
 */
export async function fetchHourlyWeather(
	lat: number,
	lng: number,
	targetDateTime: Date,
	env: Env
): Promise<ApiSnapshot_Weather> {
	const apiKey = await env.GOOGLE_PLACES_API.get();
	if (!apiKey) {
		throw new Error("GOOGLE_PLACES_API not configured");
	}

	// Fetch last 24 hours of hourly weather data
	const url = `https://weather.googleapis.com/v1/history/hours:lookup?location.latitude=${lat}&location.longitude=${lng}&hours=24&key=${apiKey}`;

	const response = await fetch(url);

	if (!response.ok) {
		const errorText = await response.text();
		console.error("[fetchHourlyWeather] API error:", response.status, errorText);
		throw new Error(`Google Weather Hourly API error: ${response.status} - ${errorText}`);
	}

	const data = await response.json();

	// Find the hour closest to targetDateTime
	const targetTime = targetDateTime.getTime();
	let closestHour: any = null;
	let minDiff = Infinity;

	for (const hour of data.historyHours || []) {
		const hourTime = new Date(hour.interval.startTime).getTime();
		const diff = Math.abs(targetTime - hourTime);

		if (diff < minDiff) {
			minDiff = diff;
			closestHour = hour;
		}
	}

	if (!closestHour) {
		console.error("[fetchHourlyWeather] No hourly data found. Full response:", JSON.stringify(data));
		throw new Error("No hourly weather data available");
	}

	// Transform to normalized format (converting to imperial units)
	const summary: WeatherSummary = {
		temp_f: closestHour.temperature?.degrees ? celsiusToFahrenheit(closestHour.temperature.degrees) : undefined,
		temp_feels_f: closestHour.feelsLikeTemperature?.degrees ? celsiusToFahrenheit(closestHour.feelsLikeTemperature.degrees) : undefined,
		condition_text: closestHour.weatherCondition?.description?.text,
		condition_code: closestHour.weatherCondition?.type,
		is_daytime: closestHour.isDaytime,
		humidity_pct: closestHour.relativeHumidity,
		pressure_inhg: closestHour.airPressure?.meanSeaLevelMillibars ? millibarsToInchesHg(closestHour.airPressure.meanSeaLevelMillibars) : undefined,
		wind_speed_mph: closestHour.wind?.speed?.value ? kilometersToMiles(closestHour.wind.speed.value) : undefined,
		wind_gust_mph: closestHour.wind?.gust?.value ? kilometersToMiles(closestHour.wind.gust.value) : undefined,
		wind_dir_deg: closestHour.wind?.direction?.degrees,
		precip_chance_pct: closestHour.precipitation?.probability?.percent,
		precip_type: closestHour.precipitation?.probability?.type,
		precip_quantity_in: closestHour.precipitation?.qpf?.quantity !== undefined ? millimetersToInches(closestHour.precipitation.qpf.quantity) : undefined,
		cloud_pct: closestHour.cloudCover,
		visibility_miles: closestHour.visibility?.distance ? kilometersToMiles(closestHour.visibility.distance) : undefined,
		uv_index: closestHour.uvIndex,
		dewpoint_f: closestHour.dewPoint?.degrees ? celsiusToFahrenheit(closestHour.dewPoint.degrees) : undefined,
		heat_index_f: closestHour.heatIndex?.degrees ? celsiusToFahrenheit(closestHour.heatIndex.degrees) : undefined,
		wind_chill_f: closestHour.windChill?.degrees ? celsiusToFahrenheit(closestHour.windChill.degrees) : undefined,
		wet_bulb_temp_f: closestHour.wetBulbTemperature?.degrees ? celsiusToFahrenheit(closestHour.wetBulbTemperature.degrees) : undefined,
		thunderstorm_prob_pct: closestHour.thunderstormProbability,
		ice_thickness_in: closestHour.iceThickness?.thickness !== undefined ? millimetersToInches(closestHour.iceThickness.thickness) : undefined,
	};

	return {
		captured_at: closestHour.interval.startTime,
		provider: {
			name: "google",
			product: "weather_historical",
			version: "v1",
		},
		summary,
	};
}
