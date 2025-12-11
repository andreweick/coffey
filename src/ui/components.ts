export function renderNav(): string {
	return `
		<a href="/" class="wa-cluster wa-gap-xs wa-align-items-center wa-link-plain">
			<wa-icon name="home"></wa-icon>
			<strong>Coffey</strong>
		</a>
		<nav class="wa-cluster wa-gap-l">
			<a href="/" class="wa-link-plain">Home</a>
			<a href="/about" class="wa-link-plain">About</a>
		</nav>
	`;
}

export function renderFooter(version?: string): string {
	const year = new Date().getFullYear();
	const versionDisplay = version ? `<span class="wa-color-text-quiet wa-body-s"> • Version: ${version}</span>` : '';
	return `
		<div class="wa-stack wa-gap-l">
			<div class="wa-grid wa-gap-xl">
				<div class="wa-stack wa-gap-s">
					<strong>About</strong>
					<a href="/about" class="wa-link-plain">About Us</a>
				</div>
				<div class="wa-stack wa-gap-s">
					<strong>Resources</strong>
					<a href="/api/docs" class="wa-link-plain">API Docs</a>
				</div>
			</div>
			<wa-divider></wa-divider>
			<div class="wa-cluster wa-gap-m wa-align-items-center">
				<span class="wa-color-text-quiet wa-body-s">&copy; ${year} Coffey</span>${versionDisplay}
			</div>
		</div>
	`;
}
