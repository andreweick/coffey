import type { Context } from "hono";
import { listPosts } from "../services/posts";
import type { PostSummary } from "../types/domain";
import { renderBlogIndex } from "../ui/blog";
import { renderPage } from "../ui/layout";

export async function handleBlogIndex(c: Context<{ Bindings: Env }>) {
	const posts = await listPosts(c.env);

	const postSummaries: PostSummary[] = posts.map((post) => ({
		slug: post.slug,
		title: post.title,
		excerpt: post.excerpt,
		publishedAt: post.publishedAt,
	}));

	const body = renderBlogIndex(postSummaries);

	const html = renderPage({
		title: "Blog - Coffey",
		description: "Latest posts from Coffey",
		body,
	});

	return c.html(html);
}
