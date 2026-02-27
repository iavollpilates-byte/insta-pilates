-- ============================================================================
-- PILATESPOST — Supabase Database Schema
-- Run this SQL in Supabase SQL Editor to create all tables
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- USERS
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('owner', 'editor')),
  avatar TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- POSTS (Board Kanban)
-- ============================================================================
CREATE TABLE IF NOT EXISTS posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  caption TEXT DEFAULT '',
  type TEXT NOT NULL DEFAULT 'reel' CHECK (type IN ('reel', 'carrossel', 'static', 'collab')),
  column_id TEXT NOT NULL DEFAULT 'idea' CHECK (column_id IN ('idea', 'draft', 'review', 'scheduled', 'published')),
  tags TEXT[] DEFAULT '{}',
  assignee UUID REFERENCES users(id) ON DELETE SET NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  scheduled_date DATE,
  scheduled_time TIME,
  notes TEXT DEFAULT '',
  ai_score INTEGER,
  ai_suggestion TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- POST METRICS
-- ============================================================================
CREATE TABLE IF NOT EXISTS post_metrics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  fetched_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- STORIES
-- ============================================================================
CREATE TABLE IF NOT EXISTS stories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'idea' CHECK (status IN ('idea', 'draft', 'scheduled', 'published')),
  pillar TEXT,
  assignee UUID REFERENCES users(id) ON DELETE SET NULL,
  scheduled_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- STORY SLIDES
-- ============================================================================
CREATE TABLE IF NOT EXISTS story_slides (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'poll', 'quiz', 'question', 'countdown', 'link', 'photo', 'video', 'repost')),
  content TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  bg TEXT DEFAULT 'gradient-dark',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- STORY METRICS
-- ============================================================================
CREATE TABLE IF NOT EXISTS story_metrics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE NOT NULL,
  views INTEGER DEFAULT 0,
  replies INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  exits INTEGER DEFAULT 0,
  taps_forward INTEGER DEFAULT 0,
  taps_back INTEGER DEFAULT 0,
  completion DECIMAL(5,2) DEFAULT 0,
  fetched_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CRM STAGES (customizable pipeline)
-- ============================================================================
CREATE TABLE IF NOT EXISTS crm_stages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  label TEXT NOT NULL,
  icon TEXT DEFAULT '📌',
  color TEXT DEFAULT '#45B7D1',
  sort_order INTEGER DEFAULT 0,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default stages
INSERT INTO crm_stages (label, icon, color, sort_order) VALUES
  ('Lead / Ideia', '🎯', '#FF6B35', 0),
  ('Contato Feito', '📩', '#F7C948', 1),
  ('Negociação', '🤝', '#4ECDC4', 2),
  ('Proposta Enviada', '📋', '#45B7D1', 3),
  ('Fechado ✅', '🏆', '#5DE8A0', 4);

-- ============================================================================
-- CRM CARDS
-- ============================================================================
CREATE TABLE IF NOT EXISTS crm_cards (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  stage_id UUID REFERENCES crm_stages(id) ON DELETE SET NULL,
  title TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  value TEXT DEFAULT '',
  priority TEXT DEFAULT 'média' CHECK (priority IN ('alta', 'média', 'baixa')),
  contact TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- HOOK BANK
-- ============================================================================
CREATE TABLE IF NOT EXISTS hooks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  text TEXT NOT NULL,
  category TEXT DEFAULT 'provocativo',
  performance_score INTEGER DEFAULT 0,
  times_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default hooks
INSERT INTO hooks (text, category, performance_score, times_used) VALUES
  ('Eu sei que dói ouvir isso. Mas...', 'provocativo', 95, 3),
  ('A verdade que ninguém te conta sobre...', 'provocativo', 89, 5),
  ('Você realmente sabe [X]? A maioria...', 'provocativo', 87, 2),
  ('Se eu pudesse voltar no tempo...', 'storytelling', 91, 1),
  ('[Número] coisas que aprendi [fazendo X]', 'educativo', 83, 7),
  ('O erro mais caro que já cometi no Pilates', 'storytelling', 93, 1),
  ('Por que [crença popular] está ERRADA', 'provocativo', 88, 4),
  ('Eu demiti meu melhor instrutor. E foi a melhor decisão.', 'storytelling', 94, 0);

-- ============================================================================
-- TRENDS
-- ============================================================================
CREATE TABLE IF NOT EXISTS trends (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  topic TEXT NOT NULL,
  source TEXT DEFAULT '',
  urgency TEXT DEFAULT 'média' CHECK (urgency IN ('alta', 'média', 'baixa')),
  description TEXT DEFAULT '',
  opportunity TEXT DEFAULT '',
  views TEXT,
  growth TEXT,
  detected_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- AI SUGGESTIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS ai_suggestions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'general',
  content TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ACTIVITY LOG
-- ============================================================================
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  post_id UUID REFERENCES posts(id) ON DELETE SET NULL,
  story_id UUID REFERENCES stories(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES for performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_posts_column ON posts(column_id);
CREATE INDEX IF NOT EXISTS idx_posts_type ON posts(type);
CREATE INDEX IF NOT EXISTS idx_posts_scheduled ON posts(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_stories_status ON stories(status);
CREATE INDEX IF NOT EXISTS idx_crm_cards_stage ON crm_cards(stage_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_user ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_story_slides_story ON story_slides(story_id);

-- ============================================================================
-- ROW LEVEL SECURITY (basic — expand per your auth setup)
-- ============================================================================
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_stages ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (refine later)
CREATE POLICY "Allow all for authenticated" ON posts FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON stories FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON crm_cards FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON crm_stages FOR ALL USING (true);

-- ============================================================================
-- REALTIME (enable for collaborative features)
-- ============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE posts;
ALTER PUBLICATION supabase_realtime ADD TABLE stories;
ALTER PUBLICATION supabase_realtime ADD TABLE crm_cards;
ALTER PUBLICATION supabase_realtime ADD TABLE crm_stages;
ALTER PUBLICATION supabase_realtime ADD TABLE activity_log;

-- ============================================================================
-- POSTS APP FIELDS (required for board save: app_id, column_id flexible, etc.)
-- If you already ran an older migrations.sql, this section updates posts + adds app_cms
-- ============================================================================
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_column_id_check;
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_type_check;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS links JSONB DEFAULT '[]';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS app_id TEXT UNIQUE;
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_assignee_fkey;
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_created_by_fkey;
ALTER TABLE posts ALTER COLUMN assignee TYPE TEXT USING assignee::TEXT;
ALTER TABLE posts ALTER COLUMN created_by TYPE TEXT USING created_by::TEXT;

CREATE TABLE IF NOT EXISTS app_cms (
  key TEXT PRIMARY KEY,
  payload JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE app_cms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for app_cms" ON app_cms FOR ALL USING (true);
CREATE INDEX IF NOT EXISTS idx_app_cms_updated ON app_cms(updated_at);

-- ============================================================================
-- MULTI-ACCOUNT (Instagram accounts: Rafael, Clara, etc.)
-- ============================================================================
CREATE TABLE IF NOT EXISTS instagram_accounts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO instagram_accounts (name, slug) VALUES
  ('Rafael', 'rafael'),
  ('Clara', 'clara')
ON CONFLICT (slug) DO NOTHING;

ALTER TABLE posts ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES instagram_accounts(id) ON DELETE CASCADE;

UPDATE posts
SET account_id = (SELECT id FROM instagram_accounts WHERE slug = 'rafael' LIMIT 1)
WHERE account_id IS NULL;

ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_app_id_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_posts_account_app_id ON posts(account_id, app_id);
CREATE INDEX IF NOT EXISTS idx_posts_account ON posts(account_id);
