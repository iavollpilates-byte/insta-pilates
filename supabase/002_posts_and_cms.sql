-- ============================================================================
-- 002: Relax posts for app (column_id, type, links, attachments, app_id)
--      Allow assignee/created_by as TEXT (app uses string ids)
--      Add app_cms for CMS blob storage
-- Run after migrations.sql in Supabase SQL Editor
-- ============================================================================

-- Relax column_id and type (app uses custom column ids and types from CMS)
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_column_id_check;
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_type_check;

-- Extra fields for app post shape
ALTER TABLE posts ADD COLUMN IF NOT EXISTS links JSONB DEFAULT '[]';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS app_id TEXT UNIQUE;

-- Allow assignee and created_by as TEXT (app uses string ids like 'rafael')
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_assignee_fkey;
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_created_by_fkey;
ALTER TABLE posts ALTER COLUMN assignee TYPE TEXT USING assignee::TEXT;
ALTER TABLE posts ALTER COLUMN created_by TYPE TEXT USING created_by::TEXT;

-- ============================================================================
-- APP CMS (single blob per key for columns, postTypes, pillars, users, etc.)
-- ============================================================================
CREATE TABLE IF NOT EXISTS app_cms (
  key TEXT PRIMARY KEY,
  payload JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE app_cms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for app_cms" ON app_cms FOR ALL USING (true);

CREATE INDEX IF NOT EXISTS idx_app_cms_updated ON app_cms(updated_at);
