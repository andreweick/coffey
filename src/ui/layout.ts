import { renderFooter, renderNav } from "./components";

export interface PageOptions {
  title: string;
  description?: string;
  body: string;
  navHtml?: string;
  footerHtml?: string;
  version?: string;
}

export function renderPage(options: PageOptions): string {
  const { title, description, body, navHtml, footerHtml, version } = options;
  const nav = navHtml ?? renderNav();
  const footer = footerHtml ?? renderFooter(version);
  const metaDescription = description
    ? `<meta name="description" content="${escapeHtml(description)}">`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<title>${escapeHtml(title)}</title>
	${metaDescription}
	<script src="https://kit.webawesome.com/d1309049507a45d3.js" crossorigin="anonymous"></script>
</head>
<body>
	<wa-page mobile-breakpoint="768">
		<header slot="header">
			${nav}
		</header>
		<main>
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
