import type { ApiSnapshot_AirQuality, AirQualitySummary } from "../../types/chatter";

export async function fetchAirQuality(
	lat: number,
	lng: number,
	env: Env
): Promise<ApiSnapshot_AirQuality> {
	const apiKey = await env.GOOGLE_PLACES_API.get();
	if (!apiKey) {
		throw new Error("GOOGLE_PLACES_API not configured");
	}

	const url = `https://airquality.googleapis.com/v1/currentConditions:lookup?key=${apiKey}`;

	const response = await fetch(url, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			location: {
				latitude: lat,
				longitude: lng,
			},
			universalAqi: true,
		}),
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`Google Air Quality API error: ${response.status} - ${errorText}`);
	}

	const data = await response.json();

	// Extract pollutant concentrations if available
	const pollutants: any = {};
	if (data.pollutants) {
		for (const pollutant of data.pollutants) {
			const code = pollutant.code;
			const concentration = pollutant.concentration?.value;
			if (code === "pm25") pollutants.pm25_ugm3 = concentration;
			if (code === "pm10") pollutants.pm10_ugm3 = concentration;
			if (code === "o3") pollutants.o3_ppb = concentration;
			if (code === "no2") pollutants.no2_ppb = concentration;
			if (code === "so2") pollutants.so2_ppb = concentration;
			if (code === "co") pollutants.co_ppm = concentration;
		}
	}

	const summary: AirQualitySummary = {
		aqi: data.indexes?.[0]?.aqi,
		aqi_scale: "US EPA",
		aqi_category: data.indexes?.[0]?.category,
		dominant_pollutant: data.indexes?.[0]?.dominantPollutant,
		...pollutants,
	};

	return {
		captured_at: new Date().toISOString(),
		provider: {
			name: "google",
			product: "air_quality",
			version: "v1",
		},
		summary,
	};
}
