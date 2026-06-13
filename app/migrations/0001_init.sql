CREATE TABLE IF NOT EXISTS gallery_categories (
  slug TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS gallery (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT NOT NULL,
  file_path TEXT NOT NULL,
  filename TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('image','video')),
  item_date TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (category) REFERENCES gallery_categories(slug)
);

CREATE INDEX IF NOT EXISTS idx_gallery_category ON gallery(category);
CREATE INDEX IF NOT EXISTS idx_gallery_created ON gallery(created_at DESC);

CREATE TABLE IF NOT EXISTS sermons (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  speaker TEXT DEFAULT '',
  sermon_date TEXT,
  scripture TEXT DEFAULT '',
  description TEXT DEFAULT '',
  youtube_id TEXT DEFAULT '',
  file_path TEXT DEFAULT '',
  duration TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_sermons_date ON sermons(sermon_date DESC);

CREATE TABLE IF NOT EXISTS contact_submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT DEFAULT '',
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  newsletter INTEGER DEFAULT 0,
  ip_address TEXT DEFAULT '',
  submitted_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_contacts_date ON contact_submissions(submitted_at DESC);

INSERT OR IGNORE INTO gallery_categories (slug, label) VALUES
  ('worship', 'Worship Services'),
  ('events', 'Events & Programs'),
  ('outreach', 'Outreach & Missions'),
  ('fellowship', 'Fellowship'),
  ('youth', 'Youth & Children'),
  ('special', 'Special Occasions');
