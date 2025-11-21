import type { Context } from "hono";
import { getPostBySlug } from "../services/posts";
import { renderBlogPost } from "../ui/blog";
import { renderPage } from "../ui/layout";

export async function handleBlogPost(c: Context<{ Bindings: Env }>) {
	const slug = c.req.param("slug");
	const post = await getPostBySlug(c.env, slug);

	if (!post) {
		const html = renderPage({
			title: "Post Not Found - Coffey",
			body: `
				<h1>Post Not Found</h1>
				<p>The post you're looking for doesn't exist.</p>
				<wa-button href="/blog" variant="primary">Back to Blog</wa-button>
			`,
		});
		return c.html(html, 404);
	}

	const body = renderBlogPost(post);

	const html = renderPage({
		title: `${post.title} - Coffey`,
		description: post.excerpt,
		body,
	});

	return c.html(html);
}
