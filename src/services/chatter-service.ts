import type { CreateChatterRequest, Chatter } from "../types/chatter";
import { enrichChatter } from "./environment/enrichment";

/**
 * Serialize object to canonical JSON with stable key ordering
 */
function canonicalJSON(obj: any): string {
	if (obj === null || typeof obj !== "object") {
		return JSON.stringify(obj);
	}

	if (Array.isArray(obj)) {
		return "[" + obj.map((item) => canonicalJSON(item)).join(",") + "]";
	}

	const keys = Object.keys(obj).sort();
	const pairs = keys.map((key) => `"${key}":${canonicalJSON(obj[key])}`);
	return "{" + pairs.join(",") + "}";
}

/**
 * Compute SHA-256 hash of JSON data
 */
async function hashJSON(data: Record<string, any>): Promise<string> {
	const canonical = canonicalJSON(data);
	const encoder = new TextEncoder();
	const buffer = encoder.encode(canonical);
	const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Create and enrich a chatter
 * @param request - Client request
 * @param env - Environment bindings
 * @returns Complete Chatter object with ID and enriched environment
 */
export async function createChatter(
	request: CreateChatterRequest,
	env: Env
): Promise<Chatter> {
	// Enrich chatter with environmental data
	const enrichedData = await enrichChatter(request, env);

	// Compute SHA256 hash of enriched chatter data
	const hash = await hashJSON(enrichedData);

	// Use provided created_at or generate current timestamp
	const createdAt = request.created_at || new Date().toISOString();

	// Build final Chatter envelope
	const chatter: Chatter = {
		type: "chatter",
		id: `sha256:${hash}`,
		schema_version: "1.0.0",
		created_at: createdAt,
		created_by: "1", // Hardcoded user ID - change when adding authentication
		data: enrichedData,
	};

	return chatter;
}

/**
 * Store chatter in R2 (for production mode)
 * @param chatter - Complete Chatter object
 * @param env - Environment bindings
 * @returns Object key and ID
 */
export async function storeChatter(
	chatter: Chatter,
	env: Env
): Promise<{ objectKey: string; id: string }> {
	// Extract hash from chatter.id (format: sha256:{hash})
	const hash = chatter.id.replace("sha256:", "");

	// Extract YYYY-MM-DD from created_at timestamp for file organization
	const yearMonthDay = chatter.created_at.substring(0, 10);

	// Build object key: chatter/json/YYYY-MM-DD-sha_{hash}.json
	const objectKey = `chatter/json/${yearMonthDay}-sha_${hash}.json`;

	// Serialize chatter to JSON
	const jsonString = JSON.stringify(chatter, null, 2);

	// Upload to R2
	await env.COFFEY_BUCKET.put(objectKey, jsonString, {
		httpMetadata: {
			contentType: "application/json",
		},
	});

	return {
		objectKey,
		id: chatter.id,
	};
}
