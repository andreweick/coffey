import type { Context } from "hono";
import { renderPage } from "../ui/layout";

export function handleHome(c: Context<{ Bindings: Env }>) {
	const body = `
		<section class="hero">
			<h1>Welcome to Coffey</h1>
			<p>A modern blog and content platform built on Cloudflare Workers.</p>
			<wa-button href="/blog" variant="primary">Read the Blog</wa-button>
		</section>
		<section class="features">
			<h2>Features</h2>
			<div class="wa-grid" style="--wa-grid-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1.5rem;">
				<wa-card>
					<h3 slot="header">Fast & Global</h3>
					<p>Powered by Cloudflare Workers, serving content from the edge worldwide.</p>
				</wa-card>
				<wa-card>
					<h3 slot="header">PWA Ready</h3>
					<p>Install as an app on your device for offline access.</p>
				</wa-card>
				<wa-card>
					<h3 slot="header">Admin API</h3>
					<p>OpenAPI-documented admin endpoints for content management.</p>
				</wa-card>
			</div>
		</section>
		<style>
			.hero {
				text-align: center;
				padding: 3rem 1rem;
			}
			.hero h1 {
				font-size: 2.5rem;
				margin-bottom: 1rem;
			}
			.hero p {
				font-size: 1.25rem;
				color: #666;
				margin-bottom: 2rem;
			}
			.features {
				padding: 2rem 0;
			}
			.features h2 {
				margin-bottom: 1.5rem;
			}
		</style>
	`;

	const html = renderPage({
		title: "Coffey - Home",
		description: "A modern blog and content platform built on Cloudflare Workers",
		body,
	});

	return c.html(html);
}
