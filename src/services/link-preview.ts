/**
 * Link metadata extracted from URL
 */
export interface LinkMetadata {
	url: string;
	title?: string;
	description?: string;
	image?: string;
	domain?: string;
}

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string {
	try {
		const urlObj = new URL(url);
		return urlObj.hostname;
	} catch {
		return "";
	}
}

/**
 * Parse OpenGraph and meta tags from HTML
 */
function parseMetaTags(html: string): Partial<LinkMetadata> {
	const metadata: Partial<LinkMetadata> = {};

	// OpenGraph title
	const ogTitle = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i);
	if (ogTitle) metadata.title = ogTitle[1];

	// OpenGraph description
	const ogDesc = html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i);
	if (ogDesc) metadata.description = ogDesc[1];

	// OpenGraph image
	const ogImage = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);
	if (ogImage) metadata.image = ogImage[1];

	// Fallback: standard meta description
	if (!metadata.description) {
		const metaDesc = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
		if (metaDesc) metadata.description = metaDesc[1];
	}

	// Fallback: <title> tag
	if (!metadata.title) {
		const titleTag = html.match(/<title>([^<]+)<\/title>/i);
		if (titleTag) metadata.title = titleTag[1].trim();
	}

	return metadata;
}

/**
 * Fetch link metadata from URL
 * @param url - URL to fetch metadata from
 * @returns Link metadata with title, description, image, domain
 */
export async function fetchLinkMetadata(url: string): Promise<LinkMetadata> {
	const metadata: LinkMetadata = {
		url,
		domain: extractDomain(url),
	};

	try {
		// Fetch the URL with timeout
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

		const response = await fetch(url, {
			signal: controller.signal,
			headers: {
				"User-Agent": "Mozilla/5.0 (compatible; CoffeyBot/1.0)",
			},
		});

		clearTimeout(timeoutId);

		if (!response.ok) {
			// Return partial metadata if fetch fails
			return metadata;
		}

		// Only parse HTML responses
		const contentType = response.headers.get("content-type") || "";
		if (!contentType.includes("text/html")) {
			return metadata;
		}

		// Read first 100KB of response (enough for meta tags)
		const text = await response.text();
		const html = text.substring(0, 100000);

		// Parse meta tags
		const parsed = parseMetaTags(html);
		Object.assign(metadata, parsed);

		return metadata;
	} catch (error) {
		// Return partial metadata on any error
		console.error(`Failed to fetch link metadata for ${url}:`, error);
		return metadata;
	}
}

/**
 * Enrich links array with metadata
 * @param links - Array of link objects (may contain just URL or partial data)
 * @returns Array of links enriched with metadata
 */
export async function enrichLinks(
	links: Array<{ url: string; [key: string]: any }>
): Promise<LinkMetadata[]> {
	// Fetch metadata for all links in parallel
	const enriched = await Promise.all(
		links.map(async (link) => {
			// If link already has metadata, keep it
			if (link.title || link.description || link.image) {
				return {
					...link,
					domain: link.domain || extractDomain(link.url),
				};
			}

			// Otherwise fetch metadata
			return await fetchLinkMetadata(link.url);
		})
	);

	return enriched;
}
