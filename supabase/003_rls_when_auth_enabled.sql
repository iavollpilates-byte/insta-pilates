-- ============================================================================
-- 003: RLS com autenticação (opcional)
-- Aplicar APENAS quando Supabase Auth estiver em uso no app.
-- Até lá, as políticas de migrations.sql e 002 (USING true) permitem anon.
-- ============================================================================
-- Como usar:
-- 1. Habilite Supabase Auth (Email, Google, etc.) no dashboard.
-- 2. No app, faça login com signInWithPassword / signInWithOAuth e use o
--    session nas chamadas ao Supabase (supabase.auth.getSession()).
-- 3. Rode este SQL no Supabase SQL Editor.
-- 4. A partir daí só usuários autenticados poderão ler/escrever.
-- ============================================================================

-- Remover políticas permissivas atuais
DROP POLICY IF EXISTS "Allow all for authenticated" ON posts;
DROP POLICY IF EXISTS "Allow all for authenticated" ON stories;
DROP POLICY IF EXISTS "Allow all for authenticated" ON crm_cards;
DROP POLICY IF EXISTS "Allow all for authenticated" ON crm_stages;
DROP POLICY IF EXISTS "Allow all for app_cms" ON app_cms;

-- Políticas restritas: apenas usuário autenticado (auth.uid() não nulo)
CREATE POLICY "Authenticated read write posts" ON posts
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated read write stories" ON stories
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated read write crm_cards" ON crm_cards
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated read write crm_stages" ON crm_stages
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated read write app_cms" ON app_cms
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Opcional: restringir por dono (quando tiver coluna user_id nas tabelas)
-- Exemplo para posts com coluna owner_id UUID REFERENCES auth.users(id):
-- CREATE POLICY "User own posts" ON posts FOR ALL USING (auth.uid() = owner_id);
