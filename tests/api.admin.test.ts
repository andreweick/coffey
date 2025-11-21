import { describe, it, expect, beforeAll } from "vitest";
import app from "../src/index";

const mockEnv: Env = {
	ADMIN_EMAILS: "admin@example.com",
	GOOGLE_PLACES_API_KEY: "test-api-key",
} as Env;

describe("Admin API endpoints", () => {
	describe("GET /admin/places/nearby", () => {
		it("should return 401 without authentication header", async () => {
			const req = new Request("http://localhost/admin/places/nearby?lat=40.7128&lng=-74.006");
			const res = await app.fetch(req, mockEnv);

			expect(res.status).toBe(401);
			const body = await res.json();
			expect(body.error).toContain("Unauthorized");
		});

		it("should return 403 for non-admin user", async () => {
			const req = new Request("http://localhost/admin/places/nearby?lat=40.7128&lng=-74.006", {
				headers: {
					"Cf-Access-Authenticated-User-Email": "user@example.com",
				},
			});
			const res = await app.fetch(req, mockEnv);

			expect(res.status).toBe(403);
		});

		it("should accept requests from admin users", async () => {
			const req = new Request("http://localhost/admin/places/nearby?lat=40.7128&lng=-74.006", {
				headers: {
					"Cf-Access-Authenticated-User-Email": "admin@example.com",
				},
			});
			const res = await app.fetch(req, mockEnv);

			// Will fail because Google API key is fake, but should get past auth
			expect(res.status).not.toBe(401);
			expect(res.status).not.toBe(403);
		});
	});

	describe("POST /admin/reindex", () => {
		it("should return 401 without authentication", async () => {
			const req = new Request("http://localhost/admin/reindex", {
				method: "POST",
			});
			const res = await app.fetch(req, mockEnv);

			expect(res.status).toBe(401);
		});

		it("should return 200 for authenticated admin", async () => {
			const req = new Request("http://localhost/admin/reindex", {
				method: "POST",
				headers: {
					"Cf-Access-Authenticated-User-Email": "admin@example.com",
				},
			});
			const res = await app.fetch(req, mockEnv);

			expect(res.status).toBe(200);
			const body = await res.json();
			expect(body.ok).toBe(true);
		});
	});

	describe("POST /admin/drop-table", () => {
		it("should reject invalid table names", async () => {
			const req = new Request("http://localhost/admin/drop-table", {
				method: "POST",
				headers: {
					"Cf-Access-Authenticated-User-Email": "admin@example.com",
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ tableName: "users" }),
			});
			const res = await app.fetch(req, mockEnv);

			expect(res.status).toBe(400);
			const body = await res.json();
			expect(body.ok).toBe(false);
			expect(body.error).toContain("not allowed");
		});
	});

	describe("POST /admin/compact-jsonl", () => {
		it("should return 200 for authenticated admin", async () => {
			const req = new Request("http://localhost/admin/compact-jsonl", {
				method: "POST",
				headers: {
					"Cf-Access-Authenticated-User-Email": "admin@example.com",
				},
			});
			const res = await app.fetch(req, mockEnv);

			expect(res.status).toBe(200);
			const body = await res.json();
			expect(body.ok).toBe(true);
		});
	});
});
