# Coffey

A Cloudflare Workers-based API for creating location-enriched "chatter" posts with environmental data, images, and link previews.

## Features

- **Location-enriched posts** - Automatically capture weather, air quality, pollen, elevation, and geocoding data
- **Image uploads** - Upload images with automatic EXIF/IPTC/ICC metadata extraction and storage in R2
- **Link previews** - Automatically fetch OpenGraph metadata (title, description, image) from URLs
- **Place selection** - Search and attach nearby venues to posts
- **Admin interface** - Web UI for creating chatters with location services

## URL Parameters for Prepopulating Form

The chatter creation form (`/admin/chatter/new`) supports URL parameters to prepopulate fields. This is useful for browser extensions, bookmarklets, or sharing workflows.

### Supported Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| `title` | Prepopulate title field | `title=My%20Post` |
| `content` | Prepopulate content textarea | `content=Check%20this%20out` |
| `comment` | Prepopulate private comment field | `comment=Personal%20note` |
| `url` | Add URL to links (can use multiple times) | `url=https://example.com` |

### Example URLs

**Single link with title:**
```
/admin/chatter/new?title=Cool%20Article&url=https://example.com
```

**Multiple links:**
```
/admin/chatter/new?url=https://site1.com&url=https://site2.com
```

**Complete example with all fields:**
```
/admin/chatter/new?title=My%20Post&content=Great%20read%20about%20web%20development&url=https://blog.example.com&comment=Follow%20up%20later
```

**Bookmarklet example (share current page):**
```javascript
javascript:(function(){window.open('/admin/chatter/new?title='+encodeURIComponent(document.title)+'&url='+encodeURIComponent(location.href),'_blank')})();
```

## API Endpoints

### Chatter Management
- `POST /api/admin/chatter` - Create new chatter with environmental enrichment
- `POST /api/admin/reindex` - Reindex all chatters

### Images
- `POST /api/admin/images` - Upload image with metadata extraction
- `GET /api/admin/images` - List all images (paginated)
- `DELETE /api/admin/images/:filename` - Delete an image
- `GET /images/:filename` - Serve image publicly

### Location Services
- `GET /api/admin/geocode/reverse?lat=X&lng=Y` - Reverse geocode coordinates
- `GET /api/admin/places/nearby?lat=X&lng=Y` - Search nearby places

### Documentation
- `GET /api/docs` - Swagger UI
- `GET /openapi.json` - OpenAPI specification
- `GET /redocs` - ReDoc documentation

## API Usage Examples

### Authentication

All admin API endpoints require Cloudflare Access authentication via service tokens:

```bash
export CF_ACCESS_CLIENT_ID="your-client-id"
export CF_ACCESS_CLIENT_SECRET="your-client-secret"
```

### Create Chatter with Multipart (Images + Data in One Request)

The create chatter endpoint supports both JSON and multipart/form-data formats. Multipart allows you to upload images directly in the same request.

**Simple chatter with image upload:**
```bash
curl -X POST https://eick.com/api/admin/chatter \
  -H "CF-Access-Client-Id: $CF_ACCESS_CLIENT_ID" \
  -H "CF-Access-Client-Secret: $CF_ACCESS_CLIENT_SECRET" \
  -F "kind=chatter" \
  -F "content=Amazing coffee shop!" \
  -F "title=Coffee Morning" \
  -F "tags=coffee" \
  -F "tags=cafe" \
  -F "images=@photo1.jpg" \
  -F "images=@photo2.jpg"
```

**With location and mixed images (new uploads + existing references):**
```bash
curl -X POST https://eick.com/api/admin/chatter \
  -H "CF-Access-Client-Id: $CF_ACCESS_CLIENT_ID" \
  -H "CF-Access-Client-Secret: $CF_ACCESS_CLIENT_SECRET" \
  -F "kind=chatter" \
  -F "content=Great place!" \
  -F "tags=restaurant" \
  -F "tags=lunch" \
  -F "images=@new-photo.jpg" \
  -F "images=https://eick.com/images/sha_existing/chatter" \
  -F 'location_hint={"lat":40.7128,"lng":-74.0060}' \
  -F 'place={"name":"Blue Bottle","formatted_address":"123 Main St","short_address":"123 Main St","location":{"lat":40.7128,"lng":-74.0060}}'
```

**With Google Place ID only (auto-fetches place details):**
```bash
curl -X POST https://eick.com/api/admin/chatter \
  -H "CF-Access-Client-Id: $CF_ACCESS_CLIENT_ID" \
  -H "CF-Access-Client-Secret: $CF_ACCESS_CLIENT_SECRET" \
  -F "kind=chatter" \
  -F "content=Amazing coffee!" \
  -F "images=@photo.jpg" \
  -F 'place={"provider_ids":{"google_places":"ChIJN1t_tDeuEmsRUsoyG83frY4"}}'
```

**Flat fields for Apple Shortcuts (easiest format):**
```bash
curl -X POST https://eick.com/api/admin/chatter \
  -H "CF-Access-Client-Id: $CF_ACCESS_CLIENT_ID" \
  -H "CF-Access-Client-Secret: $CF_ACCESS_CLIENT_SECRET" \
  -F "kind=chatter" \
  -F "content=Great coffee!" \
  -F "lat=37.7749" \
  -F "lng=-122.4194" \
  -F "placeId=ChIJN1t_tDeuEmsRUsoyG83frY4"
```

The API accepts location/place data in two formats:
- **Flat fields** (Apple Shortcuts friendly): `lat`, `lng`, `placeId`
- **JSON strings** (traditional): `location_hint`, `place`

Flat fields are automatically converted to the nested format internally. Use whichever is easier for your client.

### Create Chatter with Links

Links automatically fetch OpenGraph metadata (title, description, preview image) from the URL.

The API accepts links in three flexible formats:
- **Single URL string** (simplest, great for Apple Shortcuts): `"links": "https://example.com"`
- **Array of URL strings**: `"links": ["https://ex1.com", "https://ex2.com"]`
- **Array of link objects** (traditional): `"links": [{"url": "https://example.com"}]`

**JSON - Single link (simplest format):**
```bash
curl -X POST https://eick.com/api/admin/chatter \
  -H "CF-Access-Client-Id: $CF_ACCESS_CLIENT_ID" \
  -H "CF-Access-Client-Secret: $CF_ACCESS_CLIENT_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "chatter",
    "content": "Check this out",
    "links": "https://example.com/article"
  }'
```

**JSON - Multiple links (array of strings):**
```bash
curl -X POST https://eick.com/api/admin/chatter \
  -H "CF-Access-Client-Id: $CF_ACCESS_CLIENT_ID" \
  -H "CF-Access-Client-Secret: $CF_ACCESS_CLIENT_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "chatter",
    "content": "Resources to check out",
    "links": ["https://example.com/article1", "https://example.com/article2"]
  }'
```

**Multipart - Single link:**
```bash
curl -X POST https://eick.com/api/admin/chatter \
  -H "CF-Access-Client-Id: $CF_ACCESS_CLIENT_ID" \
  -H "CF-Access-Client-Secret: $CF_ACCESS_CLIENT_SECRET" \
  -F "kind=chatter" \
  -F "content=Check this out" \
  -F 'links="https://example.com/article"'
```

**Multipart - Multiple links with images:**
```bash
curl -X POST https://eick.com/api/admin/chatter \
  -H "CF-Access-Client-Id: $CF_ACCESS_CLIENT_ID" \
  -H "CF-Access-Client-Secret: $CF_ACCESS_CLIENT_SECRET" \
  -F "kind=chatter" \
  -F "content=Resources to check out" \
  -F "images=@photo.jpg" \
  -F 'links=["https://example.com/article1","https://example.com/article2"]'
```

**Note:** Link preview images (og:image) are stored as external URL references, not downloaded to R2.

### Create Chatter with JSON (Traditional Two-Step)

Alternatively, upload images separately first, then reference them:

**Step 1: Upload image**
```bash
curl -X POST https://eick.com/api/admin/images \
  -H "CF-Access-Client-Id: $CF_ACCESS_CLIENT_ID" \
  -H "CF-Access-Client-Secret: $CF_ACCESS_CLIENT_SECRET" \
  -F "file=@photo.jpg"

# Returns: {"objectKey": "images/sha_abc123", "uuid": "...", ...}
```

**Step 2: Create chatter with image reference**
```bash
curl -X POST https://eick.com/api/admin/chatter \
  -H "CF-Access-Client-Id: $CF_ACCESS_CLIENT_ID" \
  -H "CF-Access-Client-Secret: $CF_ACCESS_CLIENT_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "chatter",
    "content": "Check out this photo!",
    "title": "My Post",
    "tags": ["photography", "travel"],
    "images": ["https://eick.com/images/sha_abc123/chatter"],
    "location_hint": {
      "lat": 40.7128,
      "lng": -74.0060
    }
  }'
```

**With Google Place ID only (auto-fetches details):**
```bash
curl -X POST https://eick.com/api/admin/chatter \
  -H "CF-Access-Client-Id: $CF_ACCESS_CLIENT_ID" \
  -H "CF-Access-Client-Secret: $CF_ACCESS_CLIENT_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "chatter",
    "content": "Great coffee!",
    "place": {
      "provider_ids": {
        "google_places": "ChIJN1t_tDeuEmsRUsoyG83frY4"
      }
    }
  }'
```

### Backdating Posts with created_at

You can override the creation timestamp to backdate posts using the `created_at` field. This is useful for importing old content or backdating entries.

**JSON format (with timezone):**
```bash
curl -X POST https://eick.com/api/admin/chatter \
  -H "CF-Access-Client-Id: $CF_ACCESS_CLIENT_ID" \
  -H "CF-Access-Client-Secret: $CF_ACCESS_CLIENT_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "chatter",
    "content": "Posted in the past!",
    "created_at": "2024-12-01T14:30:00-05:00"
  }'
```

**Multipart format:**
```bash
curl -X POST https://eick.com/api/admin/chatter \
  -H "CF-Access-Client-Id: $CF_ACCESS_CLIENT_ID" \
  -H "CF-Access-Client-Secret: $CF_ACCESS_CLIENT_SECRET" \
  -F "kind=chatter" \
  -F "content=Backdated post from vacation" \
  -F "created_at=2024-11-15T09:00:00Z" \
  -F "images=@vacation.jpg"
```

**Note:** The `created_at` timestamp is also used to fetch historical weather data for that specific time. Weather data within the last 24 hours uses Google's hourly history API, while older dates use Open-Meteo historical data.

### Upload Image Only

```bash
curl -X POST https://eick.com/api/admin/images \
  -H "CF-Access-Client-Id: $CF_ACCESS_CLIENT_ID" \
  -H "CF-Access-Client-Secret: $CF_ACCESS_CLIENT_SECRET" \
  -F "file=@photo.jpg"
```

## Image Storage

Images are stored with content-addressable filenames using SHA-256 hashing:
- Format: `images/sha_{hash}.{ext}`
- Example: `images/sha_1a2b3c4d5e6f789.jpg`
- Automatic deduplication via hash
- Comprehensive metadata stored as R2 custom headers (EXIF, IPTC, ICC)

## Link Metadata

Links automatically fetch OpenGraph metadata:
- Page title (`og:title` or `<title>`)
- Description (`og:description` or meta description)
- Preview image (`og:image`)
- Domain extraction
- Fetch timestamp

## Chatter Schema

Each chatter is stored as JSON in R2 with the following structure:

```json
{
  "type": "chatter",
  "id": "sha256:{hash}",
  "schema_version": "1.0.0",
  "created_at": "2025-11-27T12:00:00.000Z",
  "updated_at": "2025-11-27T12:00:00.000Z",
  "created_by": "1",
  "data": {
    "kind": "chatter",
    "title": "Optional title",
    "content": "Post content",
    "comment": "Private note",
    "date_posted": "2025-11-27T12:00:00.000Z",
    "tags": ["tag1", "tag2"],
    "images": ["images/sha_abc123.jpg"],
    "links": [
      {
        "url": "https://example.com",
        "title": "Example Page",
        "description": "An example website",
        "image": "https://example.com/og-image.jpg",
        "domain": "example.com",
        "fetched_at": "2025-11-27T12:00:00.000Z"
      }
    ],
    "publish": true,
    "location_hint": {
      "lat": 37.7749,
      "lng": -122.4194,
      "accuracy_m": 10
    },
    "place": {
      "name": "Coffee Shop",
      "formatted_address": "123 Main St, San Francisco, CA",
      "short_address": "San Francisco, CA",
      "location": { "lat": 37.7749, "lng": -122.4194 },
      "provider_ids": { "google_places": "ChIJ..." }
    },
    "environment": {
      "weather": { /* Weather API snapshot */ },
      "air_quality": { /* Air quality API snapshot */ },
      "pollen": { /* Pollen API snapshot */ },
      "elevation": { /* Elevation API snapshot */ },
      "geocoding": { /* Reverse geocoding snapshot */ },
      "nearby_places": {
        /* Auto-discovered POIs within 500m (10 places) */
        "places": [
          {
            "name": "Mint Plaza",
            "formatted_address": "Mint St, San Francisco, CA",
            "short_address": "Mint St",
            "lat": 37.7749,
            "lng": -122.4194,
            "distance_m": 50,
            "place_id": "ChIJ...",
            "maps_url": "https://www.google.com/maps/place/?q=place_id:ChIJ...",
            "types": ["tourist_attraction", "park"]
          }
        ]
      }
    }
  }
}
```

## Location Coordinates

Multiple coordinate fields serve different purposes:

- **`location_hint.lat/lng`** - Device GPS (where user physically is)
- **`place.location.lat/lng`** - Selected venue (what they're posting about)
- **`environment.geocoding.lat/lng`** - Reverse geocoded address lookup
- **`environment.elevation.lat/lng`** - Elevation lookup coordinates
- **`environment.nearby_places`** - Auto-discovered POIs within 500m (10 places max)

**Note**: `place` (chosen venue) and `nearby_places` (context) are distinct. The chosen place is what you're explicitly posting about, while nearby places are automatically discovered points of interest around your GPS coordinates for environmental context.

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Deploy to Cloudflare
npm run deploy

# Generate TypeScript types from wrangler.toml
npm run cf-typegen
```

## Environment Variables

Configure in `wrangler.toml`:
- `COFFEY_BUCKET` - R2 bucket for storing chatters and images
- `GOOGLE_MAPS_API_KEY` - Google Maps API key for places/geocoding
- `GOOGLE_WEATHER_API_KEY` - Google Weather API key

## Technologies

- **Runtime**: Cloudflare Workers
- **Storage**: Cloudflare R2 (object storage) + D1 (SQL database)
- **Framework**: Hono 4.6.20 + Chanfana 2.6.3 (OpenAPI)
- **Validation**: Zod 3.24.1
- **Authentication**: Cloudflare Access (JWT + OAuth)
- **Metadata**: exifr 7.1.3 (image EXIF/IPTC/ICC)
- **JWT Signing**: jose 6.1.3

---

## Code Structure & File Breakdown

This section provides a detailed analysis of every source file, explaining what each does and how it works.

### Directory Overview

```
src/
├── index.ts              # Application entry point
├── endpoints/            # OpenAPI route handlers (API endpoints)
├── pages/                # HTML page handlers (web UI)
├── services/             # Business logic & external integrations
│   ├── environment/      # Environmental data APIs (weather, air quality, etc.)
│   ├── raindrop/         # Raindrop.io bookmark integration
│   └── tmdb/             # Movie/TV database integration
├── schemas/              # Zod validation schemas
├── types/                # TypeScript type definitions
├── middleware/           # HTTP middleware (authentication)
├── cron/                 # Scheduled task handlers
├── queue/                # Message queue handlers
├── lib/                  # Utility libraries
└── ui/                   # HTML UI components
```

---

### Core Application Files

#### `src/index.ts` - Application Entry Point

**What it does:** Bootstraps the entire Cloudflare Worker application, registers all routes, and exports the fetch/scheduled/queue handlers.

**How it works:**
1. Creates a Hono app instance with environment bindings
2. Wraps Hono with Chanfana to add OpenAPI documentation support
3. Configures documentation endpoints (`/api/docs`, `/openapi.json`, `/redocs`)
4. Applies authentication middleware to `/admin/*` and `/api/admin/*` routes
5. Registers all API endpoints (chatter, images, geocoding, places)
6. Registers HTML page routes (home, about, admin forms)
7. Exports three handlers:
   - `fetch` - HTTP request handler (main API)
   - `scheduled` - Cron trigger handler (runs maintenance and bookmark sync)
   - `queue` - Message queue handler (processes bookmark messages)

```typescript
// Key pattern: Route registration
api.post("/api/admin/chatter", AdminCreateChatterEndpoint);
app.use("/admin/*", requireAdmin);  // Middleware applied to route group
```

---

### Endpoints (`src/endpoints/`)

Each endpoint is a class extending `OpenAPIRoute` from Chanfana, providing automatic schema validation and documentation.

#### `admin-create-chatter.ts` - Create Chatter Endpoint

**What it does:** Creates location-enriched chatter posts with environmental data, images, and link previews.

**How it works:**
1. Accepts both JSON and multipart/form-data (for direct image uploads)
2. Parses request based on content-type header
3. Transforms flat fields (`lat`, `lng`, `placeId`) to nested format for Apple Shortcuts compatibility
4. Handles mixed images: uploads new files to Cloudflare Images, keeps existing URL references
5. Validates request with Zod schema (`CreateChatterRequestSchema`)
6. Calls `createChatter()` service to enrich with environmental data
7. Stores final chatter JSON to R2 via `storeChatter()`

**Key patterns:**
- Flexible input normalization (single URL → array → objects)
- Tags as repeated form fields (`-F "tags=a" -F "tags=b"`)
- JSON strings for complex objects in multipart (`-F 'location_hint={"lat":X,"lng":Y}'`)

#### `admin-upload-image.ts` - Image Upload Endpoint

**What it does:** Uploads images with automatic metadata extraction and deduplication.

**How it works:**
1. Accepts multipart/form-data with image file
2. Validates MIME type (jpeg, png, gif, webp)
3. Computes SHA-256 hash for content-addressing
4. Checks D1 database for existing image with same hash (deduplication)
5. Extracts EXIF/IPTC/ICC metadata using exifr library
6. Enriches with environmental data if GPS coordinates present
7. Uploads to Cloudflare Hosted Images API
8. Stores metadata JSON to R2 and record to D1

**Returns:** Object key (`images/sha_{hash}`), UUID, metadata, upload timestamp

#### `admin-list-images.ts` - List Images Endpoint

**What it does:** Paginated listing and search of uploaded images.

**How it works:**
1. Queries D1 `images` table with pagination (limit/offset)
2. Supports filtering by filename or date range
3. Joins with R2 metadata for full image details
4. Returns array of image objects with metadata

#### `admin-delete-image.ts` - Delete Image Endpoint

**What it does:** Soft-deletes images by setting `deleted_at` timestamp.

**How it works:**
1. Parses filename from URL path (`:filename` parameter)
2. Updates D1 record to set `deleted_at = NOW()`
3. Does NOT delete from R2 or Cloudflare Images (preserves data for recovery)

#### `admin-geocode.ts` - Reverse Geocoding Endpoint

**What it does:** Converts GPS coordinates to human-readable addresses.

**How it works:**
1. Accepts `lat` and `lng` query parameters
2. Calls Google Places API for reverse geocoding
3. Returns structured address (city, state, country, formatted address)

#### `admin-places.ts` - Nearby Places Endpoint

**What it does:** Searches for points of interest near GPS coordinates.

**How it works:**
1. Accepts `lat`, `lng`, and optional `radius` parameters
2. Calls Google Places Nearby Search API
3. Returns up to 10 places with name, address, distance, and maps URL
4. Caches results for 72 hours (configurable via `PLACES_CACHE_HOURS`)

#### `admin-reindex.ts` - Reindex Endpoint

**What it does:** Rebuilds search indexes and compacts JSONL files.

**How it works:**
1. Lists all chatter JSON files from R2 (`chatter/json/` prefix)
2. Rebuilds index files for fast lookup
3. Compacts JSONL files for efficient storage

#### `serve-image.ts` - Public Image Serving Endpoint

**What it does:** Serves transformed images with different presets (social media, content, full).

**How it works:**
1. Parses hash and preset from URL (`/images/:hash/:preset`)
2. Validates preset (chatter, content, public)
3. Looks up image in R2 by prefix (`images/sha_{hash}.`)
4. Uses Cloudflare's `cf.image` transformation option:
   - `chatter`: 1200x630 cover crop (social media cards)
   - `content`: 1200px max-width (blog posts)
   - `public`: Full resolution, metadata stripped
5. Returns transformed image with 1-year cache headers

**Key pattern (two-endpoint workaround):**
```typescript
// Main endpoint validates and applies cf.image transformation
// Uses internal fetch to raw image endpoint
const response = await fetch(internalUrl, { cf: { image: transformation } });
```

---

### Pages (`src/pages/`)

HTML page handlers that return server-rendered web UI using WebAwesome components.

#### `home.ts` - Homepage Handler

**What it does:** Renders the main landing page.

**How it works:**
1. Returns HTML wrapped in `layout()` component
2. Displays recent chatters or welcome message
3. Uses WebAwesome CSS framework for styling

#### `about.ts` - About Page Handler

**What it does:** Renders static about/information page.

#### `admin-chatter-new.ts` - Chatter Creation Form

**What it does:** Renders the admin form for creating new chatters.

**How it works:**
1. Accepts URL query parameters for prepopulation (`?title=X&url=Y`)
2. Renders form with fields for content, title, tags, images, links
3. Includes JavaScript for:
   - GPS location capture via Geolocation API
   - Nearby places search and selection
   - Image upload with preview
   - Link URL input with preview fetching
4. Submits to `/api/admin/chatter` via POST

#### `admin-image-new.ts` - Image Upload Form

**What it does:** Renders the admin form for uploading images.

**How it works:**
1. Renders file input for image selection
2. Shows upload progress and extracted metadata
3. Submits to `/api/admin/images` via POST

#### `pwa-shell.ts` - Progressive Web App Shell

**What it does:** Provides PWA manifest and shell for mobile app experience.

---

### Services (`src/services/`)

Business logic layer handling data processing and external API integrations.

#### `chatter-service.ts` - Chatter Creation Service

**What it does:** Creates, enriches, and stores chatter posts.

**How it works:**

1. **`canonicalJSON(obj)`** - Serializes objects with stable key ordering for consistent hashing
   ```typescript
   const keys = Object.keys(obj).sort();
   const pairs = keys.map(key => `"${key}":${canonicalJSON(obj[key])}`);
   return "{" + pairs.join(",") + "}";
   ```

2. **`hashJSON(data)`** - Computes SHA-256 hash of canonical JSON
   ```typescript
   const buffer = encoder.encode(canonicalJSON(data));
   const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
   ```

3. **`createChatter(request, env)`** - Main creation function
   - Calls `enrichChatter()` for environmental data
   - Computes content hash for ID (`sha256:{hash}`)
   - Uses provided `created_at` or generates current timestamp
   - Returns complete Chatter object with envelope

4. **`storeChatter(chatter, env)`** - Stores to R2
   - Extracts date from `created_at` for file organization
   - Builds object key: `chatter/json/YYYY-MM-DD-sha_{hash}.json`
   - Uploads JSON with content-type header

#### `image-upload.ts` - Image Upload Service

**What it does:** Handles complete image upload workflow with metadata extraction and deduplication.

**How it works:**

1. **`hashFile(file)`** - Computes SHA-256 of file content
2. **`checkForDuplicateImage(hash, env)`** - Queries D1 for existing hash
3. **`extractMetadata(file)`** - Parses EXIF/IPTC/ICC using exifr
4. **`enrichImageWithEnvironment(metadata, env)`** - Adds weather, elevation, geocoding if GPS present
5. **`uploadToCloudflareImages(file, env, metadata)`** - Uploads to Cloudflare Images API
6. **`saveImageRecord(...)`** - Stores to both R2 (JSON) and D1 (record)

**Key pattern - SHA-256 content addressing:**
```typescript
const hash = await hashFile(file);
const objectKey = `images/sha_${hash}`;  // Duplicate uploads return same key
```

#### `link-preview.ts` - Link Metadata Fetching

**What it does:** Fetches OpenGraph metadata from URLs for link previews.

**How it works:**

1. **`extractDomain(url)`** - Parses hostname from URL
2. **`parseMetaTags(html)`** - Regex extraction of:
   - `og:title`, `og:description`, `og:image` (OpenGraph)
   - `<meta name="description">` (fallback)
   - `<title>` tag (fallback)
3. **`fetchLinkMetadata(url)`** - Main fetch function
   - 10-second timeout via AbortController
   - User-Agent: "CoffeyBot/1.0"
   - Only parses first 100KB (enough for meta tags)
4. **`enrichLinks(links)`** - Parallel fetch for array of links
   - Preserves existing metadata if present
   - Uses Promise.all for concurrent fetching

#### `metadata-extractor.ts` - Image Metadata Extraction

**What it does:** Extracts EXIF, IPTC, and ICC metadata from images.

**How it works:**
1. Uses exifr library to parse image buffer
2. Extracts camera info (make, model, lens)
3. Extracts shooting settings (ISO, aperture, exposure, focal length)
4. Extracts GPS coordinates if present
5. Extracts IPTC keywords, caption, copyright
6. Extracts ICC color profile

#### `geocode.ts` - Geocoding Service

**What it does:** Reverse geocoding wrapper for Google Places API.

#### `places.ts` - Places Search Service

**What it does:** Nearby places search wrapper with caching.

#### `admin.ts` - Admin Utilities

**What it does:** Administrative functions like reindexing and compaction.

---

### Environment Services (`src/services/environment/`)

These services fetch environmental data from various Google APIs and cache results.

#### `enrichment.ts` - Environment Enrichment Orchestrator

**What it does:** Coordinates parallel fetching of all environmental data.

**How it works:**
1. Extracts coordinates from `location_hint` or `place`
2. If Place ID provided without name, fetches place details first
3. Fetches all environmental data in parallel using `Promise.allSettled`:
   ```typescript
   const [weather, airQuality, pollen, elevation, geocoding, nearbyPlaces] =
     await Promise.allSettled([
       fetchWeather(lat, lng, datetime, env),
       fetchAirQuality(lat, lng, env),
       fetchPollen(lat, lng, env),
       fetchElevation(lat, lng, env),
       reverseGeocodeFull(lat, lng, env),
       fetchNearbyPlaces(lat, lng, env, 500),
     ]);
   ```
4. Uses `assignIfFulfilled()` helper to handle partial failures gracefully
5. Enriches links with OpenGraph metadata
6. Fetches TMDB data if `watched` field provided

**Key pattern - Graceful degradation:**
```typescript
// Individual API failures don't block the whole request
if (result.status === "fulfilled" && result.value !== null) {
  environment[key] = result.value;
} else {
  console.error(errorMessage, result.reason);  // Log but continue
}
```

#### `weather-unified.ts` - Unified Weather Routing

**What it does:** Routes weather requests to appropriate API based on date.

**How it works:**
1. Calculates time difference from target datetime
2. If within last 24 hours → Google Weather hourly history
3. If older → Open-Meteo historical data
4. If future → Returns null (no weather data for future)

#### `google-weather.ts` - Google Weather API

**What it does:** Fetches current weather conditions.

**API:** `https://weather.googleapis.com/v1/currentConditions:lookup`

#### `google-weather-hourly.ts` - Google Hourly Weather

**What it does:** Fetches hourly weather history (last 24 hours).

**API:** `https://weather.googleapis.com/v1/history:lookup`

#### `openmeteo-historical.ts` - Open-Meteo Historical Weather

**What it does:** Fetches historical weather for dates >24 hours ago.

**API:** `https://archive-api.open-meteo.com/v1/archive`

#### `google-air-quality.ts` - Air Quality API

**What it does:** Fetches current air quality index.

**API:** `https://airquality.googleapis.com/v1/currentConditions:lookup`

#### `google-pollen.ts` - Pollen Forecast API

**What it does:** Fetches pollen forecast data.

**API:** `https://pollen.googleapis.com/v1/forecast:lookup`

#### `google-elevation.ts` - Elevation API

**What it does:** Fetches elevation from coordinates.

**API:** `https://maps.googleapis.com/maps/api/elevation/json`

#### `google-places.ts` - Place Details API

**What it does:** Fetches full place details and reverse geocoding.

**API:** `https://places.googleapis.com/v1/places/{placeId}`

#### `google-places-nearby.ts` - Nearby Places Search

**What it does:** Searches for POIs within radius with caching.

**How it works:**
1. Checks cache (KV) for existing results within cache period
2. If cache miss, calls Google Places Nearby Search API
3. Filters and formats results (name, address, distance, maps URL)
4. Stores in cache with 72-hour TTL

**API:** `https://places.googleapis.com/v1/places:searchNearby`

#### `google-places-utils.ts` - Place Utilities

**What it does:** Helper functions for place data formatting.

---

### Raindrop Integration (`src/services/raindrop/`)

Integration with Raindrop.io for bookmark synchronization.

#### `api-client.ts` - Raindrop API Client

**What it does:** Fetches bookmarks from Raindrop.io API.

**How it works:**
1. Authenticates with Raindrop API token
2. Fetches recent bookmarks (newest 50)
3. Returns raw bookmark data

#### `bookmark-processor.ts` - Bookmark Processor

**What it does:** Converts Raindrop bookmarks to internal format.

**How it works:**
1. Transforms Raindrop JSON to internal bookmark schema
2. Extracts tags, collection, cover image
3. Computes SHA-256 hash for content-addressing

#### `artifact-downloader.ts` - Artifact Downloader

**What it does:** Downloads and stores Raindrop archive artifacts.

**How it works:**
1. Fetches HTML cache from Raindrop
2. Stores to R2 for offline access

---

### TMDB Integration (`src/services/tmdb/`)

#### `tmdb-api.ts` - The Movie Database API

**What it does:** Searches and fetches movie/TV show details.

**How it works:**
1. **`searchMovie(title, env)`** - Search movies by title
2. **`searchTv(title, env)`** - Search TV shows by title
3. **`fetchMovieDetails(id, env)`** - Get full movie details
4. **`fetchTvDetails(id, env)`** - Get full TV show details

**API:** `https://api.themoviedb.org/3/`

---

### Schemas (`src/schemas/`)

Zod validation schemas for request/response validation.

#### `chatter-schemas.ts` - Chatter Schemas

**What it does:** Defines validation for chatter creation and response.

**Key schemas:**
- `CreateChatterRequestSchema` - Input validation with flexible formats
- `ChatterSchema` - Full chatter envelope structure
- `ChatterDataSchema` - Inner data structure
- `LinkInputSchema` - Flexible link format (string, array, or objects)
- `LocationHintSchema` - GPS coordinates with optional accuracy
- `PlaceInputSchema` - Place selection with provider IDs

**Key pattern - Flexible input normalization:**
```typescript
// Accepts: "url", ["url1", "url2"], or [{url: "..."}]
const LinksInput = z.union([
  z.string().transform(url => [{ url }]),
  z.array(z.string()).transform(urls => urls.map(url => ({ url }))),
  z.array(LinkObjectSchema),
]);
```

#### `image-schemas.ts` - Image Schemas

**What it does:** Defines image metadata and upload response schemas.

#### `bookmark-schemas.ts` - Bookmark Schemas

**What it does:** Defines Raindrop bookmark schemas.

#### `common.ts` - Common Response Schemas

**What it does:** Shared response patterns (error, pagination).

**Exports:**
- `standardErrorResponses` - 401, 403, 500 response definitions
- `responses.badRequest(msg)` - 400 error factory
- `ErrorResponseSchema` - Error object structure

#### `geocode-schemas.ts` - Geocoding Schemas

**What it does:** Defines reverse geocoding request/response.

#### `places-schemas.ts` - Places Schemas

**What it does:** Defines nearby places request/response.

---

### Types (`src/types/`)

TypeScript type definitions, often inferred from Zod schemas.

#### `chatter.ts` - Chatter Types

**What it does:** Exports chatter-related types.

```typescript
export type Chatter = z.infer<typeof ChatterSchema>;
export type ChatterData = z.infer<typeof ChatterDataSchema>;
export type CreateChatterRequest = z.infer<typeof CreateChatterRequestSchema>;
```

#### `image.ts` - Image Types

**What it does:** Exports image metadata and upload types.

#### `bookmark.ts` - Bookmark Types

**What it does:** Exports bookmark and Raindrop types.

#### `domain.ts` - Domain Types

**What it does:** Core domain types (Post, PostSummary, NearbyPlace).

---

### Middleware (`src/middleware/`)

#### `access.ts` - Cloudflare Access Authentication

**What it does:** Validates authentication for admin routes.

**How it works:**
1. **Development bypass** - Localhost, 127.0.0.1, dev.eick.com skip auth
2. **JWT validation** - Parses `Cf-Access-Jwt-Assertion` header
   - Fetches public keys from `{TEAM_DOMAIN}/cdn-cgi/access/certs`
   - Verifies signature and audience claim
   - Extracts email (user auth) or common_name (service token)
3. **Legacy fallback** - Checks `Cf-Access-Authenticated-User-Email` header
4. **Optional allowlist** - Checks email against `ADMIN_EMAILS` if configured

**Key pattern - Dual auth support:**
```typescript
if (payload.email) {
  return { type: "user", email: payload.email };
} else if (payload.common_name) {
  return { type: "service_token", clientId: payload.common_name };
}
```

---

### Cron Jobs (`src/cron/`)

Scheduled tasks that run on Cloudflare's cron triggers.

#### `weekly-maintenance.ts` - Maintenance Cron

**What it does:** Runs periodic maintenance tasks.

**How it works:**
1. Triggered every 30 minutes (configurable in wrangler.jsonc)
2. Checks `CRON_ENABLE` flag before running
3. Calls reindex and JSONL compaction functions

#### `bookmark-sync.ts` - Bookmark Sync Cron

**What it does:** Syncs bookmarks from Raindrop.io.

**How it works:**
1. Fetches newest 50 bookmarks from Raindrop API
2. Checks D1 for existing records
3. Creates KV work entry for new bookmarks
4. Enqueues message with random 1-11 hour delay (load spreading)

---

### Queue Handlers (`src/queue/`)

#### `bookmark-queue.ts` - Bookmark Queue Consumer

**What it does:** Processes bookmark sync messages from queue.

**How it works:**
1. Receives batch of messages from Cloudflare Queue
2. For each message:
   - Fetches full bookmark details from Raindrop
   - Computes SHA-256 hash
   - Stores to R2 (JSON) and D1 (record)
   - Downloads artifact if available
3. Acknowledges processed messages

---

### Utility Libraries (`src/lib/`)

#### `errors.ts` - Error Handling Utilities

**What it does:** Error formatting and extraction.

**Key functions:**
- `getErrorMessage(error)` - Safely extracts error message from any type
- `errorResponse(message, error)` - Formats error for JSON response

#### `duration.ts` - Duration Parsing

**What it does:** Parses human-readable duration strings.

---

### UI Components (`src/ui/`)

Server-side HTML rendering using WebAwesome CSS framework.

#### `layout.ts` - Page Layout Wrapper

**What it does:** Provides consistent HTML structure for all pages.

**How it works:**
1. Renders HTML5 doctype and head (meta, stylesheets)
2. Includes WebAwesome CSS and icons
3. Wraps content in responsive layout
4. Adds header navigation and footer

#### `components.ts` - Reusable UI Components

**What it does:** Shared UI elements (navigation, footer, forms).

---

### Database Migrations (`migrations/`)

D1 SQL migrations for schema evolution.

#### `0001_create_images_table.sql`

Creates the `images` table:
```sql
CREATE TABLE images (
  sha256 TEXT PRIMARY KEY,      -- Content-addressed hash
  uuid TEXT,                    -- Cloudflare Images UUID
  original_filename TEXT,
  date_taken TEXT,
  created_at TEXT,
  updated_at TEXT,
  deleted_at TEXT               -- Soft delete flag
);
```

#### `0002_create_bookmark_table.sql`

Creates the `bookmark` table for Raindrop sync:
```sql
CREATE TABLE bookmark (
  uuid INTEGER PRIMARY KEY,     -- Raindrop ID
  sha256 TEXT,
  link TEXT,
  title TEXT,
  excerpt TEXT,
  domain TEXT,
  type TEXT,
  cover_image_id TEXT,
  collection_id INTEGER,
  collection_title TEXT,
  tags TEXT,                    -- JSON array
  created_at TEXT,
  updated_at TEXT,
  synced_at TEXT,
  deleted_at TEXT
);
```

#### `0003_update_bookmark_cover.sql`

Schema updates for bookmark cover images.

---

### Configuration Files

#### `wrangler.jsonc` - Cloudflare Workers Configuration

**What it does:** Defines Worker settings, bindings, and environments.

**Key bindings:**
- `COFFEY_BUCKET` (R2) - Object storage for chatters, images, bookmarks
- `COFFEY_DB` (D1) - SQL database for structured queries
- `COFFEY_KV` (KV) - Key-value store for caching and work queues
- Secrets: API tokens for Google, Cloudflare, Raindrop

**Environments:**
- `dev` - Local development (dev.eick.com)
- `production` - Production deployment (eick.com)

#### `worker-configuration.d.ts` - Environment Type Definitions

**What it does:** TypeScript declarations for Cloudflare bindings.

```typescript
interface Env {
  COFFEY_BUCKET: R2Bucket;
  COFFEY_DB: D1Database;
  COFFEY_KV: KVNamespace;
  // ... secrets and variables
}
```

---

## Architecture Patterns

### 1. Content-Addressable Storage (SHA-256)

All content uses SHA-256 hashes for IDs:
- **Chatters:** `sha256:{64-char-hex}`
- **Images:** `images/sha_{hash}.{ext}`
- **Benefits:** Automatic deduplication, immutable URLs, cache-friendly

### 2. Parallel Environmental Enrichment

Uses `Promise.allSettled()` for resilient parallel fetching:
```typescript
const results = await Promise.allSettled([
  fetchWeather(...),
  fetchAirQuality(...),
  // ...
]);
// Individual failures don't block the request
```

### 3. Flexible Input Normalization

APIs accept multiple input formats and normalize internally:
- Links: `"url"` → `["url"]` → `[{url: "url"}]`
- Location: `lat=X&lng=Y` → `{location_hint: {lat: X, lng: Y}}`

### 4. Two-Endpoint Image Pattern

Works around Cloudflare Images billing:
1. Public endpoint validates and applies transformations
2. Internal endpoint serves raw images
3. Uses `cf.image` fetch option for transformations

### 5. Soft Deletes

Uses `deleted_at` column instead of hard deletes:
- Preserves audit trail
- Enables recovery
- Filtered in queries: `WHERE deleted_at IS NULL`
