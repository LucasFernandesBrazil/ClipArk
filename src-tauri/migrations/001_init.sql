PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL,
  icon TEXT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS clips (
  id TEXT PRIMARY KEY NOT NULL,
  content TEXT NOT NULL,
  normalized_content TEXT NOT NULL,
  content_hash TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  source_app TEXT NULL,
  favorite INTEGER NOT NULL DEFAULT 0,
  category_id TEXT NULL REFERENCES categories(id) ON DELETE SET NULL,
  copied_count INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  last_copied_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_clips_hash ON clips(content_hash);
CREATE INDEX IF NOT EXISTS idx_clips_last_copied_at ON clips(last_copied_at DESC);
CREATE INDEX IF NOT EXISTS idx_clips_favorite ON clips(favorite);
CREATE INDEX IF NOT EXISTS idx_clips_type ON clips(type);
CREATE INDEX IF NOT EXISTS idx_clips_category_id ON clips(category_id);
CREATE INDEX IF NOT EXISTS idx_clips_normalized_content ON clips(normalized_content);
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);

INSERT OR IGNORE INTO settings(key, value) VALUES
  ('launch_at_startup', 'false'),
  ('max_stored_clips', '5000'),
  ('tracking_paused', 'false');
