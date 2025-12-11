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
- **Storage**: Cloudflare R2
- **Framework**: Hono + Chanfana (OpenAPI)
- **Validation**: Zod
- **Metadata**: exifr (image EXIF/IPTC/ICC)
