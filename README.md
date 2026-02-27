# PilatesPost 🧡

**Gestão de Conteúdo Instagram para Pilates — com IA**

Plataforma completa para planejar, organizar, colaborar e analisar conteúdo de Instagram focado no nicho de Pilates.

## 🚀 Módulos

| Módulo | Descrição |
|--------|-----------|
| **◻ Board** | Kanban com 5 colunas (Ideia → Publicado), drag-and-drop |
| **◫ Calendário** | Visão semanal com template editorial |
| **📱 Stories** | Sequências com slides, templates, métricas |
| **📊 Métricas** | Dashboard de performance com KPIs |
| **🔥 Tendências** | Radar de trends do nicho Pilates |
| **🤝 CRM** | Pipeline customizável com etapas drag-and-drop |
| **🎣 Ganchos** | Banco de hooks rankeados por performance |
| **🧠 IA Mentor** | Chat com IA para ideias, scripts, análise |

## 🛠 Tech Stack

- **Frontend:** Next.js 14 + React 18 + Tailwind CSS
- **Backend/DB:** Supabase (PostgreSQL + Realtime + Auth)
- **IA:** Claude API (Anthropic)
- **Deploy:** Vercel

## 📦 Setup

### 1. Clone e instale

```bash
git clone https://github.com/iavollpilates-byte/insta-pilates.git
cd insta-pilates
npm install
```

### 2. Configure variáveis de ambiente

```bash
cp .env.example .env.local
```

Preencha `.env.local` com suas credenciais:
- `NEXT_PUBLIC_SUPABASE_URL` — [URL do projeto Supabase](https://hmdyythzhrjelrsnspzr.supabase.co)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhtZHl5dGh6aHJqZWxyc25zcHpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5NjM2MDEsImV4cCI6MjA4NzUzOTYwMX0.8XTWc7YSBiyFtb7NV_b9q5ovn_0lSBELhdZSwxF_nJA
- `ANTHROPIC_API_KEY` — Chave da API Claude (para IA Mentor)

### 3. Configure o banco (Supabase)

1. Crie um projeto em [supabase.com](https://supabase.com)
2. Vá em **SQL Editor** e execute na ordem:
   - `supabase/migrations.sql` — cria tabelas e políticas
   - `supabase/seed.sql` — usuários de demonstração (Rafael, Editor)
   - `supabase/policies-anon.sql` — permite uso sem login (opcional; para dev)

### 4. Rode localmente

```bash
npm run dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

### 5. Deploy (Vercel)

1. Conecte o repo no [vercel.com](https://vercel.com)
2. Adicione as variáveis de ambiente
3. Deploy automático a cada push

**Produção:** [https://insta-pilates.vercel.app/](https://insta-pilates.vercel.app/)

## 📁 Estrutura

```
insta-pilates/
├── src/
│   ├── app/
│   │   ├── globals.css      # Estilos globais + Tailwind
│   │   ├── layout.js        # Layout raiz
│   │   └── page.js          # Página principal
│   ├── components/
│   │   └── PilatesPost.jsx  # App completo (todos módulos)
│   ├── lib/
│   │   └── supabase.js      # Cliente Supabase
│   └── data/                # Dados estáticos / seeds
├── supabase/
│   └── migrations.sql       # Schema do banco
├── .env.example
├── next.config.js
├── tailwind.config.js
├── postcss.config.js
└── package.json
```

## 🗺 Roadmap

- [x] Board Kanban + drag-and-drop
- [x] Calendário editorial
- [x] IA Mentor (chat + sugestões)
- [x] AI Score por post
- [x] Métricas dashboard
- [x] Radar de tendências
- [x] CRM com pipeline customizável
- [x] Stories (sequências + templates + métricas)
- [ ] Instagram Graph API (métricas reais)
- [ ] Claude API integrado (IA real)
- [ ] Autenticação Supabase
- [ ] Realtime sync entre usuários
- [ ] Push notifications
- [ ] Multi-perfil

---

**VOLL Pilates Group** · Feito com 🧡 por Rafael Pucci
