import type { ApiSnapshot_Media, MediaSummary } from "../../types/chatter";

const TMDB_API_BASE = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/original";

/**
 * Build TMDB page URL for a movie or TV show
 */
export function buildTmdbUrl(id: number, mediaType: "movie" | "tv"): string {
	return `https://www.themoviedb.org/${mediaType}/${id}`;
}

/**
 * Search TMDB for a movie by title
 * Returns the first (most relevant) result
 */
export async function searchMovie(title: string, env: Env): Promise<{ id: number; title: string }> {
	const apiKey = await env.TMDB_API_KEY.get();
	if (!apiKey) {
		throw new Error("TMDB_API_KEY not configured");
	}

	const url = `${TMDB_API_BASE}/search/movie?query=${encodeURIComponent(title)}&api_key=${apiKey}`;
	const response = await fetch(url);

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`TMDB search movie error: ${response.status} - ${errorText}`);
	}

	const data = await response.json();

	if (!data.results || data.results.length === 0) {
		throw new Error(`No movie found for title: ${title}`);
	}

	return {
		id: data.results[0].id,
		title: data.results[0].title,
	};
}

/**
 * Search TMDB for a TV show by title
 * Returns the first (most relevant) result
 */
export async function searchTv(title: string, env: Env): Promise<{ id: number; name: string }> {
	const apiKey = await env.TMDB_API_KEY.get();
	if (!apiKey) {
		throw new Error("TMDB_API_KEY not configured");
	}

	const url = `${TMDB_API_BASE}/search/tv?query=${encodeURIComponent(title)}&api_key=${apiKey}`;
	const response = await fetch(url);

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`TMDB search TV error: ${response.status} - ${errorText}`);
	}

	const data = await response.json();

	if (!data.results || data.results.length === 0) {
		throw new Error(`No TV show found for title: ${title}`);
	}

	return {
		id: data.results[0].id,
		name: data.results[0].name,
	};
}

/**
 * Fetch movie details from TMDB including credits
 */
export async function fetchMovieDetails(
	tmdbId: number,
	env: Env
): Promise<ApiSnapshot_Media> {
	const apiKey = await env.TMDB_API_KEY.get();
	if (!apiKey) {
		throw new Error("TMDB_API_KEY not configured");
	}

	const url = `${TMDB_API_BASE}/movie/${tmdbId}?api_key=${apiKey}&append_to_response=credits`;
	const response = await fetch(url);

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`TMDB fetch movie error: ${response.status} - ${errorText}`);
	}

	const data = await response.json();

	// Extract director from crew
	const director = data.credits?.crew?.find(
		(person: any) => person.job === "Director"
	)?.name;

	// Extract top cast (up to 5 actors)
	const cast = data.credits?.cast
		?.slice(0, 5)
		.map((person: any) => person.name) || [];

	// Extract genres
	const genres = data.genres?.map((genre: any) => genre.name) || [];

	// Build normalized summary
	const summary: MediaSummary = {
		media_type: "movie",
		tmdb_id: data.id,
		title: data.title,
		release_date: data.release_date,
		overview: data.overview,
		poster_url: data.poster_path ? `${TMDB_IMAGE_BASE}${data.poster_path}` : undefined,
		backdrop_url: data.backdrop_path ? `${TMDB_IMAGE_BASE}${data.backdrop_path}` : undefined,
		genres,
		tmdb_rating: data.vote_average,
		vote_count: data.vote_count,
		tmdb_url: buildTmdbUrl(data.id, "movie"),
		runtime: data.runtime,
		director,
		cast,
	};

	return {
		captured_at: new Date().toISOString(),
		provider: {
			name: "themoviedb",
			product: "api",
			version: "3",
		},
		summary,
	};
}

/**
 * Fetch TV show details from TMDB including credits
 */
export async function fetchTvDetails(
	tmdbId: number,
	env: Env
): Promise<ApiSnapshot_Media> {
	const apiKey = await env.TMDB_API_KEY.get();
	if (!apiKey) {
		throw new Error("TMDB_API_KEY not configured");
	}

	const url = `${TMDB_API_BASE}/tv/${tmdbId}?api_key=${apiKey}&append_to_response=credits`;
	const response = await fetch(url);

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`TMDB fetch TV error: ${response.status} - ${errorText}`);
	}

	const data = await response.json();

	// Extract creators
	const creators = data.created_by?.map((person: any) => person.name) || [];

	// Extract top cast (up to 5 actors)
	const cast = data.credits?.cast
		?.slice(0, 5)
		.map((person: any) => person.name) || [];

	// Extract genres
	const genres = data.genres?.map((genre: any) => genre.name) || [];

	// Build normalized summary
	const summary: MediaSummary = {
		media_type: "tv",
		tmdb_id: data.id,
		title: data.name,
		release_date: data.first_air_date,
		overview: data.overview,
		poster_url: data.poster_path ? `${TMDB_IMAGE_BASE}${data.poster_path}` : undefined,
		backdrop_url: data.backdrop_path ? `${TMDB_IMAGE_BASE}${data.backdrop_path}` : undefined,
		genres,
		tmdb_rating: data.vote_average,
		vote_count: data.vote_count,
		tmdb_url: buildTmdbUrl(data.id, "tv"),
		number_of_seasons: data.number_of_seasons,
		number_of_episodes: data.number_of_episodes,
		creators,
		cast,
	};

	return {
		captured_at: new Date().toISOString(),
		provider: {
			name: "themoviedb",
			product: "api",
			version: "3",
		},
		summary,
	};
}
