import { describe, it, expect } from "vitest";
import app from "../src/index";

const mockEnv: Env = {} as Env;

describe("Blog pages", () => {
	describe("GET /blog", () => {
		it("should return 200 and HTML content", async () => {
			const req = new Request("http://localhost/blog");
			const res = await app.fetch(req, mockEnv);

			expect(res.status).toBe(200);
			expect(res.headers.get("content-type")).toContain("text/html");

			const html = await res.text();
			expect(html).toContain("<!DOCTYPE html>");
			expect(html).toContain("<title>");
			expect(html).toContain("Blog");
		});

		it("should include Web Awesome components", async () => {
			const req = new Request("http://localhost/blog");
			const res = await app.fetch(req, mockEnv);
			const html = await res.text();

			expect(html).toContain("web-awesome");
			expect(html).toContain("wa-page");
		});
	});

	describe("GET /blog/:slug", () => {
		it("should return 404 for non-existent post", async () => {
			const req = new Request("http://localhost/blog/non-existent-post");
			const res = await app.fetch(req, mockEnv);

			expect(res.status).toBe(404);
			const html = await res.text();
			expect(html).toContain("Not Found");
		});

		it("should return HTML even for 404", async () => {
			const req = new Request("http://localhost/blog/non-existent-post");
			const res = await app.fetch(req, mockEnv);

			expect(res.headers.get("content-type")).toContain("text/html");
			const html = await res.text();
			expect(html).toContain("<!DOCTYPE html>");
		});
	});

	describe("GET /", () => {
		it("should return the home page", async () => {
			const req = new Request("http://localhost/");
			const res = await app.fetch(req, mockEnv);

			expect(res.status).toBe(200);
			const html = await res.text();
			expect(html).toContain("Welcome");
			expect(html).toContain("Coffey");
		});
	});

	describe("GET /app", () => {
		it("should return the PWA shell", async () => {
			const req = new Request("http://localhost/app");
			const res = await app.fetch(req, mockEnv);

			expect(res.status).toBe(200);
			const html = await res.text();
			expect(html).toContain("id=\"app\"");
			expect(html).toContain("serviceWorker");
		});
	});
});
