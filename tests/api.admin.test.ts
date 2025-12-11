import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";
import app from "../src/index";

const mockEnv: Env = {
	ADMIN_EMAILS: "admin@example.com",
	GOOGLE_PLACES_API: "test-api-key",
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

	describe("DELETE /api/admin/images/:filename", () => {
		let mockR2Bucket: R2Bucket;
		let testEnv: Env;

		beforeEach(() => {
			// Create a mock R2 bucket
			const mockStorage = new Map<string, { body: ArrayBuffer; metadata: any }>();

			mockR2Bucket = {
				list: vi.fn(async (options: { prefix: string; limit?: number }) => {
					const matches: any[] = [];
					for (const [key, _value] of mockStorage.entries()) {
						if (key.startsWith(options.prefix)) {
							matches.push({
								key,
								size: 1024,
								etag: "test-etag",
								uploaded: new Date(),
								httpEtag: "test-http-etag",
							});
							if (options.limit && matches.length >= options.limit) {
								break;
							}
						}
					}
					return {
						objects: matches,
						truncated: false,
						delimitedPrefixes: [],
					};
				}),
				delete: vi.fn(async (key: string) => {
					mockStorage.delete(key);
				}),
				put: vi.fn(async (key: string, body: any, options?: any) => {
					mockStorage.set(key, { body, metadata: options });
				}),
				get: vi.fn(async (key: string) => {
					const data = mockStorage.get(key);
					if (!data) return null;
					return {
						body: data.body,
						httpEtag: "test-etag",
						writeHttpMetadata: (headers: Headers) => {
							headers.set("content-type", "image/jpeg");
						},
					};
				}),
				head: vi.fn(async (key: string) => {
					const data = mockStorage.get(key);
					if (!data) return null;
					return {
						key,
						size: 1024,
						etag: "test-etag",
						uploaded: new Date(),
					};
				}),
				// Add a helper to seed test data
				_seed: (key: string) => {
					mockStorage.set(key, {
						body: new ArrayBuffer(1024),
						metadata: {},
					});
				},
			} as unknown as R2Bucket;

			testEnv = {
				...mockEnv,
				COFFEY_BUCKET: mockR2Bucket,
			} as Env;
		});

		it("should return 401 without authentication", async () => {
			const req = new Request("http://localhost/api/admin/images/sha_abc123", {
				method: "DELETE",
			});
			const res = await app.fetch(req, testEnv);

			expect(res.status).toBe(401);
		});

		it("should return 403 for non-admin user", async () => {
			const req = new Request("http://localhost/api/admin/images/sha_abc123", {
				method: "DELETE",
				headers: {
					"Cf-Access-Authenticated-User-Email": "user@example.com",
				},
			});
			const res = await app.fetch(req, testEnv);

			expect(res.status).toBe(403);
		});

		it("should successfully delete image using extensionless hash", async () => {
			// Seed the mock bucket with a test image
			(mockR2Bucket as any)._seed("images/sha_abc123.jpg");

			const req = new Request("http://localhost/api/admin/images/sha_abc123", {
				method: "DELETE",
				headers: {
					"Cf-Access-Authenticated-User-Email": "admin@example.com",
				},
			});
			const res = await app.fetch(req, testEnv);

			expect(res.status).toBe(200);
			const body = await res.json();
			expect(body.success).toBe(true);
			expect(body.key).toBe("images/sha_abc123.jpg");

			// Verify delete was called with the correct key
			expect(mockR2Bucket.delete).toHaveBeenCalledWith("images/sha_abc123.jpg");
		});

		it("should handle images with different extensions (png)", async () => {
			(mockR2Bucket as any)._seed("images/sha_def456.png");

			const req = new Request("http://localhost/api/admin/images/sha_def456", {
				method: "DELETE",
				headers: {
					"Cf-Access-Authenticated-User-Email": "admin@example.com",
				},
			});
			const res = await app.fetch(req, testEnv);

			expect(res.status).toBe(200);
			const body = await res.json();
			expect(body.success).toBe(true);
			expect(body.key).toBe("images/sha_def456.png");
		});

		it("should handle images with different extensions (webp)", async () => {
			(mockR2Bucket as any)._seed("images/sha_ghi789.webp");

			const req = new Request("http://localhost/api/admin/images/sha_ghi789", {
				method: "DELETE",
				headers: {
					"Cf-Access-Authenticated-User-Email": "admin@example.com",
				},
			});
			const res = await app.fetch(req, testEnv);

			expect(res.status).toBe(200);
			const body = await res.json();
			expect(body.success).toBe(true);
			expect(body.key).toBe("images/sha_ghi789.webp");
		});

		it("should handle images with different extensions (gif)", async () => {
			(mockR2Bucket as any)._seed("images/sha_jkl012.gif");

			const req = new Request("http://localhost/api/admin/images/sha_jkl012", {
				method: "DELETE",
				headers: {
					"Cf-Access-Authenticated-User-Email": "admin@example.com",
				},
			});
			const res = await app.fetch(req, testEnv);

			expect(res.status).toBe(200);
			const body = await res.json();
			expect(body.success).toBe(true);
			expect(body.key).toBe("images/sha_jkl012.gif");
		});

		it("should return 404 when image does not exist", async () => {
			const req = new Request("http://localhost/api/admin/images/sha_nonexistent", {
				method: "DELETE",
				headers: {
					"Cf-Access-Authenticated-User-Email": "admin@example.com",
				},
			});
			const res = await app.fetch(req, testEnv);

			expect(res.status).toBe(404);
			const body = await res.json();
			expect(body.error).toBe("Image not found");
			expect(body.details).toContain("sha_nonexistent");

			// Verify delete was NOT called
			expect(mockR2Bucket.delete).not.toHaveBeenCalled();
		});

		it("should handle R2 list operation correctly", async () => {
			(mockR2Bucket as any)._seed("images/sha_test123.jpg");

			const req = new Request("http://localhost/api/admin/images/sha_test123", {
				method: "DELETE",
				headers: {
					"Cf-Access-Authenticated-User-Email": "admin@example.com",
				},
			});
			await app.fetch(req, testEnv);

			// Verify list was called with correct prefix
			expect(mockR2Bucket.list).toHaveBeenCalledWith({
				prefix: "images/sha_test123.",
				limit: 1,
			});
		});
	});
});
