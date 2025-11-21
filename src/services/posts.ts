import type { CreatePostData, Post } from "../types/domain";

function generateSlug(title: string): string {
	return title
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "");
}

function generateExcerpt(body: string, maxLength = 160): string {
	if (body.length <= maxLength) return body;
	return body.slice(0, maxLength).trim() + "...";
}

export async function listPosts(env: Env): Promise<Post[]> {
	// TODO: implement with env.DB
	// const results = await env.DB.prepare(
	//   "select * from posts where published_at is not null order by published_at desc"
	// ).all();
	return [];
}

export async function getPostBySlug(env: Env, slug: string): Promise<Post | null> {
	// TODO: implement with env.DB
	// const result = await env.DB.prepare(
	//   "select * from posts where slug = ? and published_at is not null"
	// ).bind(slug).first();
	return null;
}

export async function createPost(env: Env, data: CreatePostData): Promise<Post> {
	const now = new Date().toISOString();
	const id = crypto.randomUUID();
	const slug = generateSlug(data.title);
	const excerpt = generateExcerpt(data.body);

	const post: Post = {
		id,
		slug,
		title: data.title,
		body: data.body,
		excerpt,
		authorEmail: data.authorEmail,
		imageId: data.imageId,
		publishedAt: now,
		createdAt: now,
		updatedAt: now,
	};

	// TODO: implement with env.DB
	// await env.DB.prepare(
	//   "insert into posts (id, slug, title, body, excerpt, author_email, image_id, published_at, created_at, updated_at) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
	// ).bind(post.id, post.slug, post.title, post.body, post.excerpt, post.authorEmail, post.imageId ?? null, post.publishedAt, post.createdAt, post.updatedAt).run();

	return post;
}
