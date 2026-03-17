-- Migration 001: Initial schema
-- Creates all base tables and indexes

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS groups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  short_code TEXT NOT NULL UNIQUE,
  target_url TEXT NOT NULL,
  title TEXT,
  group_id INTEGER REFERENCES groups(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'paused', 'expired')),
  enable_intermediate INTEGER DEFAULT 0,
  intermediate_type TEXT DEFAULT 'browser_tip' CHECK(intermediate_type IN ('browser_tip', 'custom_html')),
  intermediate_content TEXT,
  enable_ua_detection INTEGER DEFAULT 1,
  ua_rules TEXT,
  expire_at TEXT,
  pv_count INTEGER DEFAULT 0,
  uv_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS access_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  link_id INTEGER NOT NULL REFERENCES links(id) ON DELETE CASCADE,
  short_code TEXT NOT NULL,
  ip TEXT,
  user_agent TEXT,
  referer TEXT,
  platform TEXT,
  device_type TEXT,
  os TEXT,
  browser TEXT,
  action_taken TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_links_short_code ON links(short_code);
CREATE INDEX IF NOT EXISTS idx_links_group_id ON links(group_id);
CREATE INDEX IF NOT EXISTS idx_links_status ON links(status);
CREATE INDEX IF NOT EXISTS idx_links_created_at ON links(created_at);
CREATE INDEX IF NOT EXISTS idx_access_logs_link_id_created ON access_logs(link_id, created_at);
CREATE INDEX IF NOT EXISTS idx_access_logs_created_at ON access_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_access_logs_short_code ON access_logs(short_code);
CREATE INDEX IF NOT EXISTS idx_access_logs_platform ON access_logs(platform);
