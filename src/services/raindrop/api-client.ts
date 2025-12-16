import type {
	Raindrop,
	RaindropListResponse,
	Collection,
	CollectionListResponse,
} from "../../types/bookmark";
import {
	RaindropListResponseSchema,
	CollectionListResponseSchema,
	RaindropSchema,
} from "../../schemas/bookmark-schemas";

const BASE_URL = "https://api.raindrop.io/rest/v1";

/**
 * Get authorization header for Raindrop API
 */
async function getAuthHeader(env: Env): Promise<string> {
	const token = await env.RAINDROP_TEST_TOKEN.get();
	if (!token) {
		throw new Error("RAINDROP_TEST_TOKEN not configured");
	}
	return `Bearer ${token}`;
}

/**
 * Fetch raindrops from Raindrop.io API
 * @param env - Environment bindings
 * @param options - Query options
 * @returns Raindrop list response
 */
export async function fetchRaindrops(
	env: Env,
	options: {
		collectionId?: number; // 0 for all, -1 for unsorted, or specific collection ID
		perpage?: number; // Max 50
		page?: number; // 0-indexed
		sort?: string; // "created", "-created", "title", etc.
		search?: string; // Search query
	} = {}
): Promise<RaindropListResponse> {
	const {
		collectionId = 0,
		perpage = 50,
		page = 0,
		sort = "created", // Default: oldest first for backlog sync
		search,
	} = options;

	const params = new URLSearchParams({
		perpage: perpage.toString(),
		page: page.toString(),
		sort,
	});

	if (search) {
		params.set("search", search);
	}

	const url = `${BASE_URL}/raindrops/${collectionId}?${params}`;
	const authHeader = await getAuthHeader(env);

	const response = await fetch(url, {
		headers: {
			Authorization: authHeader,
		},
	});

	if (!response.ok) {
		throw new Error(
			`Raindrop API error: ${response.status} ${response.statusText}`
		);
	}

	const data = await response.json();
	return RaindropListResponseSchema.parse(data);
}

/**
 * Fetch a single raindrop by ID
 * @param env - Environment bindings
 * @param raindropId - Raindrop ID
 * @returns Single raindrop
 */
export async function fetchRaindrop(
	env: Env,
	raindropId: number
): Promise<Raindrop> {
	const url = `${BASE_URL}/raindrop/${raindropId}`;
	const authHeader = await getAuthHeader(env);

	const response = await fetch(url, {
		headers: {
			Authorization: authHeader,
		},
	});

	if (!response.ok) {
		throw new Error(
			`Raindrop API error: ${response.status} ${response.statusText}`
		);
	}

	const data = await response.json();
	return RaindropSchema.parse(data.item);
}

/**
 * Fetch all collections from Raindrop.io
 * @param env - Environment bindings
 * @returns Collection list
 */
export async function fetchCollections(env: Env): Promise<Collection[]> {
	const authHeader = await getAuthHeader(env);
	const collections: Collection[] = [];

	// Fetch root collections
	const rootResponse = await fetch(`${BASE_URL}/collections`, {
		headers: {
			Authorization: authHeader,
		},
	});

	if (!rootResponse.ok) {
		throw new Error(
			`Raindrop API error: ${rootResponse.status} ${rootResponse.statusText}`
		);
	}

	const rootData = await rootResponse.json();
	const rootCollections = CollectionListResponseSchema.parse(rootData);
	collections.push(...rootCollections.items);

	// Fetch child collections
	const childResponse = await fetch(`${BASE_URL}/collections/childrens`, {
		headers: {
			Authorization: authHeader,
		},
	});

	if (!childResponse.ok) {
		throw new Error(
			`Raindrop API error: ${childResponse.status} ${childResponse.statusText}`
		);
	}

	const childData = await childResponse.json();
	const childCollections = CollectionListResponseSchema.parse(childData);
	collections.push(...childCollections.items);

	return collections;
}

/**
 * Get permanent copy URL for a raindrop
 * Note: Requires PRO plan
 * @param env - Environment bindings
 * @param raindropId - Raindrop ID
 * @returns Redirect URL to permanent copy (S3)
 */
export async function getPermanentCopyUrl(
	env: Env,
	raindropId: number
): Promise<string | null> {
	const url = `${BASE_URL}/raindrop/${raindropId}/cache`;
	const authHeader = await getAuthHeader(env);

	const response = await fetch(url, {
		headers: {
			Authorization: authHeader,
		},
		redirect: "manual", // Don't follow redirect, we want the Location header
	});

	// Raindrop API returns 307 redirect with Location header
	if (response.status === 307) {
		const location = response.headers.get("Location");
		return location;
	}

	// If no permanent copy exists, API returns different status
	if (response.status === 404 || response.status === 400) {
		return null;
	}

	throw new Error(
		`Unexpected response from permanent copy endpoint: ${response.status}`
	);
}
