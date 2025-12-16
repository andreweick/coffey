-- Migration number: 0003 	 2025-12-12T00:00:00.000Z

-- Replace cover_image_id with cover_url
-- SQLite doesn't support DROP COLUMN directly, so we need to recreate the table

-- Create new table with updated schema
CREATE TABLE bookmark_new (
    uuid INTEGER PRIMARY KEY,
    sha256 TEXT NOT NULL,
    link TEXT NOT NULL,
    title TEXT NOT NULL,
    excerpt TEXT,
    domain TEXT,
    type TEXT,
    cover_url TEXT,
    collection_id INTEGER,
    collection_title TEXT,
    tags TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    synced_at TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at TEXT
);

-- Copy data from old table (cover_image_id will be NULL in cover_url)
INSERT INTO bookmark_new (
    uuid, sha256, link, title, excerpt, domain, type,
    cover_url, collection_id, collection_title, tags,
    created_at, updated_at, synced_at, deleted_at
)
SELECT
    uuid, sha256, link, title, excerpt, domain, type,
    NULL as cover_url,  -- Old cover_image_id is not compatible
    collection_id, collection_title, tags,
    created_at, updated_at, synced_at, deleted_at
FROM bookmark;

-- Drop old table
DROP TABLE bookmark;

-- Rename new table
ALTER TABLE bookmark_new RENAME TO bookmark;

-- Recreate indexes
CREATE INDEX idx_bookmark_uuid ON bookmark(uuid);
CREATE INDEX idx_bookmark_sha256 ON bookmark(sha256);
CREATE INDEX idx_bookmark_created_at ON bookmark(created_at);
CREATE INDEX idx_bookmark_collection_id ON bookmark(collection_id);
CREATE INDEX idx_bookmark_domain ON bookmark(domain);
CREATE INDEX idx_bookmark_type ON bookmark(type);
CREATE INDEX idx_bookmark_deleted_at ON bookmark(deleted_at);
