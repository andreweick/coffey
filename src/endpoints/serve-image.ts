import { OpenAPIRoute } from "chanfana";
import type { Context } from "hono";
import { responses } from "../schemas/common";
import { errorResponse } from "../lib/errors";

// Valid image variant names (configured in Cloudflare Images dashboard)
const VALID_VARIANTS = ["chatter", "content", "public"] as const;
type VariantName = typeof VALID_VARIANTS[number];

export class ServeImage extends OpenAPIRoute {
	schema = {
		tags: ["Images"],
		summary: "Serve an image file with transformations",
		description:
			"Publicly accessible endpoint to serve transformed images from Cloudflare Hosted Images. " +
			"Requires a variant parameter to specify the image transformation. " +
			"All variants strip metadata (EXIF/GPS/IPTC). " +
			"URL format: /images/sha_{hash}/{variant} " +
			"Available variants: 'chatter' (1200x630 social media), 'content' (1200px max-width), 'public' (full resolution)",
		responses: {
			"302": {
				description: "Redirect to signed Cloudflare Images URL",
			},
			"400": responses.badRequest("Invalid variant"),
			"404": responses.notFound("Image not found"),
			"500": responses.internalServerError(),
		},
	};

	async handle(c: Context<{ Bindings: Env }>) {
		try {
			// Get hash and variant from URL
			const hashParam = c.req.param("hash");
			const variantParam = c.req.param("preset");
			let hash = hashParam?.endsWith("/") ? hashParam.slice(0, -1) : hashParam;
			const variant = variantParam?.endsWith("/")
				? variantParam.slice(0, -1)
				: variantParam;

			// Strip "sha_" prefix if present (URL format is sha_{hash}, DB stores just {hash})
			if (hash?.startsWith("sha_")) {
				hash = hash.slice(4);
			}

			// Validate variant
			if (!variant || !VALID_VARIANTS.includes(variant as VariantName)) {
				return c.json(
					{
						error: "Invalid variant",
						details: `Variant must be one of: ${VALID_VARIANTS.join(", ")}`,
					},
					400
				);
			}

			// Look up image UUID from database by sha256
			const result = await c.env.COFFEY_DB.prepare(
				`SELECT uuid FROM images WHERE sha256 = ? AND deleted_at IS NULL`
			)
				.bind(hash)
				.first<{ uuid: string }>();

			if (!result?.uuid) {
				return c.json(
					{
						error: "Image not found",
						details: `No image found with hash: ${hash}`,
					},
					404
				);
			}

			// Get account hash and signing key from secrets
			const accountHash = await c.env.CF_HOSTED_IMAGES_HASH.get();
			if (!accountHash) {
				return c.json(
					{
						error: "Configuration error",
						details: "CF_HOSTED_IMAGES_HASH not configured",
					},
					500
				);
			}

			const signingKey = await c.env.CF_HOSTED_IMAGES_KEYS_API_TOKEN.get();
			if (!signingKey) {
				return c.json(
					{
						error: "Configuration error",
						details: "CF_HOSTED_IMAGES_KEYS_API_TOKEN not configured",
					},
					500
				);
			}

			// Generate signed URL using HMAC-SHA256 (following Cloudflare's example)
			const expiry = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
			const urlPath = `/${accountHash}/${result.uuid}/${variant}`;
			const stringToSign = `${urlPath}?exp=${expiry}`;

			// Create HMAC-SHA256 signature
			const encoder = new TextEncoder();
			const secretKeyData = encoder.encode(signingKey);
			const key = await crypto.subtle.importKey(
				"raw",
				secretKeyData,
				{ name: "HMAC", hash: "SHA-256" },
				false,
				["sign"]
			);

			const mac = await crypto.subtle.sign("HMAC", key, encoder.encode(stringToSign));

			// Convert to hex string (not base64!)
			const sig = [...new Uint8Array(mac)]
				.map((x) => x.toString(16).padStart(2, "0"))
				.join("");

			// Build signed delivery URL
			const signedUrl = `https://imagedelivery.net${urlPath}?exp=${expiry}&sig=${sig}`;

			// Redirect to signed URL
			return c.redirect(signedUrl, 302);
		} catch (error) {
			return c.json(errorResponse("Internal server error", error), 500);
		}
	}
}
