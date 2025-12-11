-- Migration number: 0001 	 2025-12-08T19:22:55.671Z
CREATE TABLE images (
    sha256 TEXT PRIMARY KEY,
    uuid TEXT,
    original_filename TEXT,
    date_taken TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at TEXT
 );

 -- Create indexes (no need for sha256 index since it's the primary key)
 CREATE INDEX idx_images_uuid ON images(uuid);
 CREATE INDEX idx_images_original_filename ON images(original_filename);
 CREATE INDEX idx_images_date_taken ON images(date_taken);
 CREATE INDEX idx_images_deleted_at ON images(deleted_at);
