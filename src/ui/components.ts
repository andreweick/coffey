export function renderNav(): string {
	return `
		<nav class="site-nav">
			<div class="nav-container">
				<a href="/" class="nav-brand">
					<wa-icon name="home"></wa-icon>
					<span>Coffey</span>
				</a>
				<div class="nav-links">
					<a href="/">Home</a>
					<a href="/blog">Blog</a>
					<a href="/about">About</a>
				</div>
			</div>
		</nav>
		<style>
			.site-nav {
				background: var(--wa-color-brand-fill-normal);
				color: var(--wa-color-brand-on-normal);
				padding: 0.75rem 1rem;
			}
			.nav-container {
				max-width: 1200px;
				margin: 0 auto;
				display: flex;
				justify-content: space-between;
				align-items: center;
			}
			.nav-brand {
				display: flex;
				align-items: center;
				gap: 0.5rem;
				color: var(--wa-color-brand-on-normal);
				text-decoration: none;
				font-weight: bold;
				font-size: 1.25rem;
			}
			.nav-links {
				display: flex;
				gap: 1.5rem;
			}
			.nav-links a {
				color: var(--wa-color-brand-on-normal);
				text-decoration: none;
				opacity: 0.9;
			}
			.nav-links a:hover {
				opacity: 1;
				text-decoration: underline;
			}
		</style>
	`;
}

export function renderFooter(): string {
	const year = new Date().getFullYear();
	return `
		<div class="site-footer">
			<div class="footer-container">
				<p>&copy; ${year} Coffey. All rights reserved.</p>
				<div class="footer-links">
					<a href="/privacy">Privacy</a>
					<a href="/terms">Terms</a>
				</div>
			</div>
		</div>
		<style>
			.site-footer {
				background: var(--wa-color-surface-lowered);
				padding: 1.5rem 1rem;
				margin-top: 2rem;
			}
			.footer-container {
				max-width: 1200px;
				margin: 0 auto;
				display: flex;
				justify-content: space-between;
				align-items: center;
				flex-wrap: wrap;
				gap: 1rem;
			}
			.footer-container p {
				margin: 0;
				color: var(--wa-color-text-quiet);
			}
			.footer-links {
				display: flex;
				gap: 1.5rem;
			}
			.footer-links a {
				color: var(--wa-color-text-quiet);
				text-decoration: none;
			}
			.footer-links a:hover {
				text-decoration: underline;
			}
		</style>
	`;
}
