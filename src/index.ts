import { fromHono } from "chanfana";
import { Hono } from "hono";
import { runWeeklyMaintenance } from "./cron/weekly-maintenance";
import { AdminCreateChatterEndpoint } from "./endpoints/admin-create-chatter";
import { AdminDeleteImage } from "./endpoints/admin-delete-image";
import { AdminGeocodeReverseEndpoint } from "./endpoints/admin-geocode";
import { AdminListImages } from "./endpoints/admin-list-images";
import { AdminNearbyPlacesEndpoint } from "./endpoints/admin-places";
import { AdminReindexEndpoint } from "./endpoints/admin-reindex";
import { AdminUploadImage } from "./endpoints/admin-upload-image";
import { ServeImage } from "./endpoints/serve-image";
import { requireAdmin } from "./middleware/access";
import { handleAbout } from "./pages/about";
import { handleAdminChatterNew } from "./pages/admin-chatter-new";
import { handleAdminImageNew } from "./pages/admin-image-new";
import { handleHome } from "./pages/home";
import { handlePwaShell } from "./pages/pwa-shell";

// Start a Hono app
const app = new Hono<{ Bindings: Env }>();

// Setup OpenAPI registry with admin tag
const api = fromHono(app, {
	docs_url: "/api/docs",
	openapi_url: "/openapi.json",
	redoc_url: "/redocs",
	schema: {
		info: {
			title: "Coffey Admin API",
			version: "1.0.0",
			description: "Admin-only API for Coffey content management",
		},
		tags: [
			{
				name: "admin",
				description: "Admin-only operations (requires Cloudflare Access). Supports creating chatters with optional enrichments: places, environment data, links, images, and watched movies/TV shows from TMDB.",
			},
			{
				name: "Admin - Images",
				description: "Image upload and management (requires admin authentication)",
			},
			{
				name: "Images",
				description: "Public image serving",
			},
		],
	},
});

// Apply admin middleware to all /admin/* and /api/admin/* routes
app.use("/admin/*", requireAdmin);
app.use("/api/admin/*", requireAdmin);

// Register OpenAPI admin endpoints
api.post("/api/admin/chatter", AdminCreateChatterEndpoint);
api.get("/api/admin/geocode/reverse", AdminGeocodeReverseEndpoint);
api.get("/api/admin/places/nearby", AdminNearbyPlacesEndpoint);
api.post("/api/admin/reindex", AdminReindexEndpoint);

// Register image endpoints
api.post("/api/admin/images", AdminUploadImage);
api.get("/api/admin/images", AdminListImages);
api.delete("/api/admin/images/:filename", AdminDeleteImage);
// Public image serving - requires variant (chatter, content, or public)
api.get("/images/:hash/:preset/", ServeImage);
api.get("/images/:hash/:preset", ServeImage);

// Register admin HTML routes
app.get("/admin/chatter/new", handleAdminChatterNew);
app.get("/admin/images/new", handleAdminImageNew);

// Register public HTML routes
app.get("/", handleHome);
app.get("/about", handleAbout);
app.get("/app", handlePwaShell);

// Export the Hono app as fetch handler
export default {
	fetch: app.fetch,
	scheduled: async (event: ScheduledEvent, env: Env, ctx: ExecutionContext) => {
		// Run weekly maintenance on cron trigger
		ctx.waitUntil(runWeeklyMaintenance(env));
	},
};
