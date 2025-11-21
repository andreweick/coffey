import { describe, it, expect, vi } from "vitest";
import { listPosts, getPostBySlug, createPost } from "../src/services/posts";

const mockEnv: Env = {} as Env;

describe("Posts service", () => {
	describe("listPosts", () => {
		it("should return an empty array (stub implementation)", async () => {
			const posts = await listPosts(mockEnv);

			expect(Array.isArray(posts)).toBe(true);
			expect(posts).toHaveLength(0);
		});
	});

	describe("getPostBySlug", () => {
		it("should return null for any slug (stub implementation)", async () => {
			const post = await getPostBySlug(mockEnv, "test-post");

			expect(post).toBeNull();
		});
	});

	describe("createPost", () => {
		it("should create a post with generated fields", async () => {
			const post = await createPost(mockEnv, {
				authorEmail: "author@example.com",
				title: "Test Post Title",
				body: "This is the body of the test post.",
			});

			expect(post.id).toBeDefined();
			expect(post.slug).toBe("test-post-title");
			expect(post.title).toBe("Test Post Title");
			expect(post.body).toBe("This is the body of the test post.");
			expect(post.authorEmail).toBe("author@example.com");
			expect(post.publishedAt).toBeDefined();
			expect(post.createdAt).toBeDefined();
			expect(post.updatedAt).toBeDefined();
		});

		it("should generate excerpt from body", async () => {
			const longBody = "A".repeat(200);
			const post = await createPost(mockEnv, {
				authorEmail: "author@example.com",
				title: "Long Post",
				body: longBody,
			});

			expect(post.excerpt.length).toBeLessThanOrEqual(163); // 160 + "..."
			expect(post.excerpt).toContain("...");
		});

		it("should not truncate short body for excerpt", async () => {
			const shortBody = "Short content";
			const post = await createPost(mockEnv, {
				authorEmail: "author@example.com",
				title: "Short Post",
				body: shortBody,
			});

			expect(post.excerpt).toBe(shortBody);
		});

		it("should include imageId when provided", async () => {
			const post = await createPost(mockEnv, {
				authorEmail: "author@example.com",
				title: "Post with Image",
				body: "Content",
				imageId: "img-123",
			});

			expect(post.imageId).toBe("img-123");
		});
	});
});
