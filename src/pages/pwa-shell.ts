import type { Context } from "hono";
import { renderPage } from "../ui/layout";

export function handlePwaShell(c: Context<{ Bindings: Env }>) {
	const body = `
		<div id="app">
			<wa-spinner size="large"></wa-spinner>
			<p>Loading application...</p>
		</div>
		<script type="module">
			// PWA shell initialization
			if ('serviceWorker' in navigator) {
				navigator.serviceWorker.register('/sw.js').catch(console.error);
			}

			// App shell hydration would happen here
			const app = document.getElementById('app');

			// Example: check online status
			function updateOnlineStatus() {
				if (!navigator.onLine) {
					app.innerHTML = '<wa-alert variant="warning">You are offline. Some features may be unavailable.</wa-alert>';
				}
			}

			window.addEventListener('online', updateOnlineStatus);
			window.addEventListener('offline', updateOnlineStatus);
		</script>
		<style>
			#app {
				display: flex;
				flex-direction: column;
				align-items: center;
				justify-content: center;
				min-height: 50vh;
				text-align: center;
			}
			#app wa-spinner {
				margin-bottom: 1rem;
			}
		</style>
	`;

	const html = renderPage({
		title: "Coffey App",
		description: "Coffey Progressive Web App",
		body,
	});

	return c.html(html);
}
