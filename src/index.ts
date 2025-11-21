import { fromHono } from "chanfana";
import { Hono } from "hono";
import { runWeeklyMaintenance } from "./cron/weekly-maintenance";
import { AdminCompactJsonlEndpoint } from "./endpoints/admin-maintenance";
import { AdminNearbyPlacesEndpoint } from "./endpoints/admin-places";
import { AdminReindexEndpoint } from "./endpoints/admin-reindex";
import { AdminDropTableEndpoint } from "./endpoints/admin-drop-table";
import { requireAdmin } from "./middleware/access";
import { handleAbout } from "./pages/about";
import { handleBlogIndex } from "./pages/blog-index";
import { handleBlogPost } from "./pages/blog-post";
import { handleHome } from "./pages/home";
import { handlePwaShell } from "./pages/pwa-shell";

// Start a Hono app
const app = new Hono<{ Bindings: Env }>();

// Setup OpenAPI registry with admin tag
const api = fromHono(app, {
	docs_url: "/api/docs",
	schema: {
		info: {
			title: "Coffey Admin API",
			version: "1.0.0",
			description: "Admin-only API for Coffey content management",
		},
		tags: [
			{
				name: "admin",
				description: "Admin-only operations (requires Cloudflare Access)",
			},
		],
	},
});

// Apply admin middleware to all /admin/* routes
app.use("/admin/*", requireAdmin);

// Register OpenAPI admin endpoints
api.get("/admin/places/nearby", AdminNearbyPlacesEndpoint);
api.post("/admin/reindex", AdminReindexEndpoint);
api.post("/admin/drop-table", AdminDropTableEndpoint);
api.post("/admin/compact-jsonl", AdminCompactJsonlEndpoint);

// Register public HTML routes
app.get("/", handleHome);
app.get("/about", handleAbout);
app.get("/blog", handleBlogIndex);
app.get("/blog/:slug", handleBlogPost);
app.get("/app", handlePwaShell);

// Export the Hono app as fetch handler
export default {
	fetch: app.fetch,
	scheduled: async (event: ScheduledEvent, env: Env, ctx: ExecutionContext) => {
		// Run weekly maintenance on cron trigger
		ctx.waitUntil(runWeeklyMaintenance(env));
	},
};
