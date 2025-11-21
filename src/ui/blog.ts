import type { Post, PostSummary } from "../types/domain";

export function renderBlogIndex(posts: PostSummary[]): string {
	if (posts.length === 0) {
		return `
			<h1>Blog</h1>
			<p>No posts yet. Check back soon!</p>
		`;
	}

	const postCards = posts
		.map(
			(post) => `
			<wa-card class="post-card">
				<h2 slot="header">
					<a href="/blog/${escapeHtml(post.slug)}">${escapeHtml(post.title)}</a>
				</h2>
				<p>${escapeHtml(post.excerpt)}</p>
				<div slot="footer">
					<time datetime="${post.publishedAt}">${formatDate(post.publishedAt)}</time>
				</div>
			</wa-card>
		`
		)
		.join("\n");

	return `
		<h1>Blog</h1>
		<div class="wa-grid" style="--wa-grid-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem;">
			${postCards}
		</div>
		<style>
			.post-card h2 a {
				color: inherit;
				text-decoration: none;
			}
			.post-card h2 a:hover {
				text-decoration: underline;
			}
		</style>
	`;
}

export function renderBlogPost(post: Post): string {
	return `
		<article class="blog-post">
			<header>
				<h1>${escapeHtml(post.title)}</h1>
				<div class="post-meta">
					<time datetime="${post.publishedAt}">${formatDate(post.publishedAt)}</time>
					<span class="author">by ${escapeHtml(post.authorEmail)}</span>
				</div>
			</header>
			<div class="post-body">
				${post.body}
			</div>
		</article>
		<style>
			.blog-post {
				max-width: 720px;
				margin: 0 auto;
			}
			.post-meta {
				color: #666;
				margin-bottom: 2rem;
			}
			.post-meta time {
				margin-right: 1rem;
			}
			.post-body {
				line-height: 1.7;
			}
		</style>
	`;
}

function escapeHtml(str: string): string {
	return str
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
}

function formatDate(isoDate: string): string {
	const date = new Date(isoDate);
	return date.toLocaleDateString("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric",
	});
}
