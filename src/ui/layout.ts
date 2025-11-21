import { renderFooter, renderNav } from "./components";

export interface PageOptions {
  title: string;
  description?: string;
  body: string;
  navHtml?: string;
  footerHtml?: string;
}

export function renderPage(options: PageOptions): string {
  const { title, description, body, navHtml, footerHtml } = options;
  const nav = navHtml ?? renderNav();
  const footer = footerHtml ?? renderFooter();
  const metaDescription = description
    ? `<meta name="description" content="${escapeHtml(description)}">`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>${escapeHtml(title)}</title>
	${metaDescription}
	<link rel="manifest" href="/manifest.json">
	<meta name="theme-color" content="#3b82f6">
	<!-- TODO: Replace with your Web Awesome Pro project code -->
	<script type="module" src="https://cdn.webawesome.com/d1309049507a45d3/webawesome.loader.js"></script>
	<style>
		body {
			margin: 0;
		}
		.container {
			max-width: 1200px;
			margin: 0 auto;
			padding: 1rem;
		}
	</style>
</head>
<body>
	<wa-page mobile-breakpoint="768">
		<header slot="header">
			${nav}
		</header>
		<main slot="main" class="container">
			${body}
		</main>
		<footer slot="footer">
			${footer}
		</footer>
	</wa-page>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
