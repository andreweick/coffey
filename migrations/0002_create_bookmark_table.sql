-- Migration number: 0002 	 2025-12-11T00:00:00.000Z
CREATE TABLE bookmark (
    uuid INTEGER PRIMARY KEY,
    sha256 TEXT NOT NULL,
    link TEXT NOT NULL,
    title TEXT NOT NULL,
    excerpt TEXT,
    domain TEXT,
    type TEXT,
    cover_image_id TEXT,
    collection_id INTEGER,
    collection_title TEXT,
    tags TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    synced_at TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at TEXT
);

-- Create indexes for common queries
CREATE INDEX idx_bookmark_uuid ON bookmark(uuid);
CREATE INDEX idx_bookmark_sha256 ON bookmark(sha256);
CREATE INDEX idx_bookmark_created_at ON bookmark(created_at);
CREATE INDEX idx_bookmark_collection_id ON bookmark(collection_id);
CREATE INDEX idx_bookmark_domain ON bookmark(domain);
CREATE INDEX idx_bookmark_type ON bookmark(type);
CREATE INDEX idx_bookmark_deleted_at ON bookmark(deleted_at);
