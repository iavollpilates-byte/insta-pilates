# Supabase — Insta Pilates / CORATERIA

## Ordem das migrações

1. **migrations.sql** — Schema principal (users, posts, post_metrics, stories, story_slides, crm_stages, crm_cards, hooks, trends, app_cms, etc.) e RLS inicial com `USING (true)`.
2. **002_posts_and_cms.sql** — Ajustes em `posts` (app_id, links, attachments, assignee/created_by como TEXT) e criação da tabela `app_cms`.
3. **003_rls_when_auth_enabled.sql** — (Opcional) Aplicar só quando for usar **Supabase Auth**. Substitui as políticas por `auth.uid() IS NOT NULL`; sem login, o app não verá/alterará dados.

## RLS e segurança

- Por padrão, as políticas permitem todas as operações para qualquer cliente com a anon key (`USING (true)`). Isso é adequado para uso local ou com controle de acesso por outro meio.
- Quando quiser restringir por usuário, ative o Auth no Supabase, integre o login no app e execute **003_rls_when_auth_enabled.sql**. A partir daí apenas usuários autenticados poderão ler/escrever.
- Para multi-tenant (dados por usuário), adicione uma coluna `user_id` (ou `owner_id`) nas tabelas e altere as políticas para `USING (auth.uid() = user_id)`.

## Realtime

O schema já adiciona as tabelas à publicação `supabase_realtime`. Para usar subscriptions no app, conecte com o client Supabase após o deploy.
