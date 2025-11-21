export interface Post {
	id: string;
	slug: string;
	title: string;
	body: string;
	excerpt: string;
	authorEmail: string;
	imageId?: string;
	publishedAt: string;
	createdAt: string;
	updatedAt: string;
}

export interface PostSummary {
	slug: string;
	title: string;
	excerpt: string;
	publishedAt: string;
}

export interface NearbyPlace {
	placeId: string;
	name: string;
	address?: string;
	lat: number;
	lng: number;
	types?: string[];
}

export interface CreatePostData {
	authorEmail: string;
	title: string;
	body: string;
	imageId?: string;
}
