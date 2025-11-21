import type { Post } from "../types/domain";

/**
 * Content loader for file-based posts.
 * This is a placeholder for loading posts from static files (markdown, JSON, etc.)
 * In production, this could read from D1 or KV storage.
 */
export async function loadPostsFromFiles(): Promise<Post[]> {
	// TODO: implement file-based post loading if needed
	// Could read from __STATIC_CONTENT or bundled files
	return [];
}

/**
 * Parse frontmatter from a markdown string.
 * Returns the frontmatter data and the body content.
 */
export function parseFrontmatter(content: string): { data: Record<string, string>; body: string } {
	const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
	const match = content.match(frontmatterRegex);

	if (!match) {
		return { data: {}, body: content };
	}

	const [, frontmatter, body] = match;
	const data: Record<string, string> = {};

	for (const line of frontmatter.split("\n")) {
		const colonIndex = line.indexOf(":");
		if (colonIndex > 0) {
			const key = line.slice(0, colonIndex).trim();
			const value = line.slice(colonIndex + 1).trim().replace(/^["']|["']$/g, "");
			data[key] = value;
		}
	}

	return { data, body: body.trim() };
}
