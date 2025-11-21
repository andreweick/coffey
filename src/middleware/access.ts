import type { Context, Next } from "hono";

export async function requireAdmin(c: Context<{ Bindings: Env }>, next: Next) {
	const email = c.req.header("Cf-Access-Authenticated-User-Email");

	if (!email) {
		return c.json({ error: "Unauthorized: missing authentication" }, 401);
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
