import type { Context } from "hono";
import { renderPage } from "../ui/layout";

export function handleAbout(c: Context<{ Bindings: Env }>) {
	const body = `
		<section class="about-hero">
			<h1>About Coffey</h1>
			<p class="lead">Building the future of content, one post at a time.</p>
		</section>

		<section class="about-content">
			<wa-card>
				<h2 slot="header">Our Story</h2>
				<p>
					Coffey started as a simple idea: what if publishing content on the web could be
					as fast and reliable as the edge itself? Built on Cloudflare Workers, we deliver
					content from data centers around the world in milliseconds.
				</p>
				<p>
					Our platform combines the simplicity of static sites with the power of dynamic
					applications. No servers to manage, no scaling to worry about—just write and publish.
				</p>
			</wa-card>

			<wa-card>
				<h2 slot="header">The Technology</h2>
				<p>
					We believe in using the right tools for the job. That's why Coffey is built with:
				</p>
				<ul>
					<li><strong>Cloudflare Workers</strong> — Lightning-fast edge computing</li>
					<li><strong>Hono</strong> — Ultralight web framework</li>
					<li><strong>Web Awesome</strong> — Beautiful, accessible UI components</li>
					<li><strong>D1</strong> — Serverless SQL at the edge</li>
				</ul>
			</wa-card>

			<wa-card>
				<h2 slot="header">API Documentation</h2>
				<p>
					Coffey exposes an OpenAPI-documented admin API for content management and integrations.
					Explore the interactive documentation to see available endpoints.
				</p>
				<wa-button variant="primary" href="/api/docs">View API Docs</wa-button>
			</wa-card>

			<wa-card>
				<h2 slot="header">Get in Touch</h2>
				<p>
					Have questions or feedback? We'd love to hear from you. Reach out through our
					admin portal or drop us a line.
				</p>
				<wa-button variant="primary" href="/blog">Read Our Blog</wa-button>
			</wa-card>
		</section>

		<style>
			.about-hero {
				text-align: center;
				padding: 3rem 1rem;
				margin-bottom: 2rem;
			}
			.about-hero h1 {
				font-size: 2.5rem;
				margin-bottom: 1rem;
			}
			.about-hero .lead {
				font-size: 1.25rem;
				color: var(--wa-color-text-quiet);
			}
			.about-content {
				display: grid;
				gap: 1.5rem;
			}
			.about-content wa-card {
				padding: 0.5rem;
			}
			.about-content ul {
				padding-left: 1.5rem;
			}
			.about-content li {
				margin-bottom: 0.5rem;
			}
		</style>
	`;

	const html = renderPage({
		title: "About - Coffey",
		description: "Learn more about Coffey and the technology behind it",
		body,
	});

	return c.html(html);
}
