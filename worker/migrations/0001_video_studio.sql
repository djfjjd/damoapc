CREATE TABLE IF NOT EXISTS video_projects (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, purpose TEXT NOT NULL DEFAULT 'social', style TEXT NOT NULL DEFAULT 'clean',
  aspect_ratio TEXT NOT NULL DEFAULT '9:16', resolution TEXT NOT NULL DEFAULT '720p', duration INTEGER NOT NULL DEFAULT 15,
  captions INTEGER NOT NULL DEFAULT 0, timeline_json TEXT NOT NULL DEFAULT '[]', created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS media_assets (
  id TEXT PRIMARY KEY, project_id TEXT NOT NULL, name TEXT NOT NULL, mime_type TEXT NOT NULL, size INTEGER NOT NULL DEFAULT 0,
  r2_key TEXT NOT NULL, kind TEXT NOT NULL, duration REAL, created_at TEXT NOT NULL,
  FOREIGN KEY(project_id) REFERENCES video_projects(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_assets_project ON media_assets(project_id);
CREATE TABLE IF NOT EXISTS video_jobs (
  id TEXT PRIMARY KEY, project_id TEXT, kind TEXT NOT NULL DEFAULT 'generate', status TEXT NOT NULL, progress INTEGER NOT NULL DEFAULT 0,
  prompt TEXT, input_mode TEXT, model TEXT, duration INTEGER, resolution TEXT, aspect_ratio TEXT, input_key TEXT,
  provider_operation TEXT, output_key TEXT, error TEXT, attempt INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_jobs_project ON video_jobs(project_id);
