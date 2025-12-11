import type { Context } from "hono";
import { renderPage } from "../ui/layout";

export function handleHome(c: Context<{ Bindings: Env }>) {
	const body = `
		<div class="wa-stack wa-gap-xl">
			<div class="wa-stack wa-gap-m">
				<h1 class="wa-heading-2xl">Coffey Roast Collection</h1>
				<p class="wa-body-l wa-color-text-quiet">Premium single-origin beans, roasted to perfection.</p>
			</div>

			<div class="wa-stack wa-gap-m">
				<h2 class="wa-heading-l">Our Process</h2>
				<p class="wa-body-m">Every batch begins with hand-selected beans from sustainable farms across Ethiopia, Colombia, and Guatemala. Our master roasters carefully develop each profile to bring out the unique characteristics of every origin.</p>
				<p class="wa-body-m">From light and fruity to dark and bold, we craft roasts that celebrate the full spectrum of coffee flavor. Each bag is roasted to order and shipped within 48 hours.</p>
			</div>

			<wa-divider></wa-divider>

			<div class="wa-grid wa-gap-l">
				<div class="wa-stack wa-gap-s">
					<strong class="wa-heading-m">Light Roast</strong>
					<p class="wa-body-s wa-color-text-quiet">Bright acidity with notes of citrus and florals. Perfect for pour-over.</p>
				</div>
				<div class="wa-stack wa-gap-s">
					<strong class="wa-heading-m">Medium Roast</strong>
					<p class="wa-body-s wa-color-text-quiet">Balanced sweetness with caramel and nutty undertones. Great all-around.</p>
				</div>
				<div class="wa-stack wa-gap-s">
					<strong class="wa-heading-m">Dark Roast</strong>
					<p class="wa-body-s wa-color-text-quiet">Rich and smoky with chocolate finish. Ideal for espresso.</p>
				</div>
			</div>
		</div>
	`;

	const html = renderPage({
		title: "Coffey - Home",
		description: "A modern blog and content platform built on Cloudflare Workers",
		body,
	});

	return c.html(html);
}
