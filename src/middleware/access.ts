import type { Context, Next } from "hono";
import { jwtVerify, createRemoteJWKSet } from "jose";

/**
 * Cloudflare Access authentication middleware
 *
 * Supports two authentication methods:
 * 1. User authentication (GitHub OAuth, IP-based) - sets adminEmail
 * 2. Service token authentication (API access) - sets adminServiceToken
 *
 * In development mode (localhost, 127.0.0.1, dev.eick.com), authentication is bypassed.
 */
export async function requireAdmin(c: Context<{ Bindings: Env }>, next: Next) {
	const url = new URL(c.req.url);

	// Skip auth on localhost and dev.eick.com (no Cloudflare Access proxy in local dev)
	if (
		url.hostname === "localhost" ||
		url.hostname === "127.0.0.1" ||
		url.hostname === "dev.eick.com"
	) {
		c.set("adminEmail", "dev@localhost");
		return next();
	}

	// Try JWT validation first (supports both user auth and service tokens)
	const jwt = c.req.header("Cf-Access-Jwt-Assertion");
	if (jwt) {
		try {
			const authResult = await validateAccessJWT(jwt, c.env);

			if (authResult.type === "user") {
				// User authentication (GitHub, IP-based, etc.)
				c.set("adminEmail", authResult.email);

				// Optionally check against an allowlist
				const allowedEmails = c.env.ADMIN_EMAILS;
				if (allowedEmails) {
					const emailList = allowedEmails
						.split(",")
						.map((e) => e.trim().toLowerCase());
					if (!emailList.includes(authResult.email.toLowerCase())) {
						return c.json({ error: "Forbidden: not an admin" }, 403);
					}
				}
			} else {
				// Service token authentication
				c.set("adminServiceToken", authResult.clientId);
				}

			return next();
		} catch (error) {
				// Fall through to legacy header check
		}
	}

	// Fallback: Check for legacy Cf-Access-Authenticated-User-Email header
	// This is injected by Cloudflare Access for user authentication
	const email = c.req.header("Cf-Access-Authenticated-User-Email");

	if (!email) {
		return c.json(
			{
				error: "Unauthorized: missing authentication",
				details: "No valid JWT or authentication header found",
			},
			401
		);
	}

	// Optionally check against an allowlist
	const allowedEmails = c.env.ADMIN_EMAILS;
	if (allowedEmails) {
		const emailList = allowedEmails.split(",").map((e) => e.trim().toLowerCase());
		if (!emailList.includes(email.toLowerCase())) {
			return c.json({ error: "Forbidden: not an admin" }, 403);
		}
	}

	c.set("adminEmail", email);
	await next();
}

/**
 * Authentication result types
 */
type AuthResult =
	| { type: "user"; email: string }
	| { type: "service_token"; clientId: string };

/**
 * Validate Cloudflare Access JWT
 *
 * @param jwt - The JWT from Cf-Access-Jwt-Assertion header
 * @param env - Environment bindings containing TEAM_DOMAIN and POLICY_AUD
 * @returns Authentication result with user email or service token client ID
 * @throws Error if JWT is invalid or verification fails
 */
async function validateAccessJWT(jwt: string, env: Env): Promise<AuthResult> {
	const teamDomain = env.TEAM_DOMAIN;
	const policyAud = env.POLICY_AUD;

	if (!teamDomain) {
		throw new Error("TEAM_DOMAIN not configured");
	}

	if (!policyAud) {
		throw new Error("POLICY_AUD not configured");
	}

	// Fetch Cloudflare's public keys for JWT signature verification
	const jwksUrl = `${teamDomain}/cdn-cgi/access/certs`;
	const JWKS = createRemoteJWKSet(new URL(jwksUrl));

	// Verify JWT signature and claims
	const { payload } = await jwtVerify(jwt, JWKS, {
		issuer: teamDomain,
		audience: policyAud,
	});

	// Check authentication type based on JWT payload
	if (payload.email && typeof payload.email === "string") {
		// User authentication (GitHub OAuth, IP-based, etc.)
		return {
			type: "user",
			email: payload.email,
		};
	} else if (payload.common_name && typeof payload.common_name === "string") {
		// Service token authentication
		return {
			type: "service_token",
			clientId: payload.common_name,
		};
	} else {
		throw new Error("JWT payload missing email or common_name claim");
	}
}
