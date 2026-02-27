/**
 * Tema, constantes e utilitários compartilhados do app.
 * T é mutado por setThemeTokens(theme) no App para aplicar tema claro/escuro.
 */

export const THEME_STORAGE_KEY = "insta-pilates-theme";
export const T_DARK = {
  bg: "#0B0B1A",
  surface: "#12122A",
  card: "rgba(255,255,255,0.03)",
  cardHover: "rgba(255,255,255,0.06)",
  border: "rgba(255,255,255,0.06)",
  borderHover: "rgba(255,255,255,0.12)",
  text: "#E8E8F0",
  textMuted: "rgba(255,255,255,0.45)",
  textDim: "rgba(255,255,255,0.25)",
  accent: "#FF6B35",
  accentGlow: "rgba(255,107,53,0.15)",
  accentBorder: "rgba(255,107,53,0.35)",
  accentText: "#FFFFFF",
  logoText: "#FFFFFF",
  yellow: "#F7C948",
  green: "#5DE8A0",
  greenBg: "rgba(93,232,160,0.1)",
  greenBorder: "rgba(93,232,160,0.25)",
  cyan: "#4ECDC4",
  red: "#FF5757",
  purple: "#A78BFA",
  purpleBg: "rgba(167,139,250,0.06)",
  purpleBorder: "rgba(167,139,250,0.25)",
  pink: "#FF8FAB",
  font: "'DM Sans',-apple-system,sans-serif",
  mono: "'JetBrains Mono','Fira Code',monospace",
};
export const T_LIGHT = {
  bg: "#FAFAFC",
  surface: "#FFFFFF",
  card: "rgba(0,0,0,0.03)",
  cardHover: "rgba(0,0,0,0.06)",
  border: "rgba(0,0,0,0.08)",
  borderHover: "rgba(0,0,0,0.14)",
  text: "#1A1A24",
  textMuted: "#666",
  textDim: "#999",
  accent: "#FF6B35",
  accentGlow: "rgba(255,107,53,0.12)",
  accentBorder: "rgba(255,107,53,0.4)",
  accentText: "#FFFFFF",
  logoText: "#FFFFFF",
  yellow: "#E6A800",
  green: "#0D9488",
  greenBg: "rgba(13,148,136,0.08)",
  greenBorder: "rgba(13,148,136,0.25)",
  cyan: "#0891B2",
  red: "#DC2626",
  purple: "#7C3AED",
  purpleBg: "rgba(124,58,237,0.08)",
  purpleBorder: "rgba(124,58,237,0.25)",
  pink: "#DB2777",
  font: "'DM Sans',-apple-system,sans-serif",
  mono: "'JetBrains Mono','Fira Code',monospace",
};

export const T = { ...T_DARK };

export function setThemeTokens(theme) {
  Object.assign(T, theme === "light" ? T_LIGHT : T_DARK);
}

export const COLUMNS = [
  { id: "ideias_rascunhos", label: "Ideias e Rascunhos", icon: "💡", color: "#FF6B35", desc: "Brainstorms" },
  { id: "prod", label: "Prod. e Desenvolvimento", icon: "✍️", color: "#F7C948", desc: "Em desenvolvimento" },
  { id: "edicao_revisao", label: "Edição e Revisão", icon: "👀", color: "#4ECDC4", desc: "Aprovação" },
  { id: "prontos", label: "Prontos", icon: "✅", color: "#45B7D1", desc: "Pronto" },
  { id: "agendado", label: "Agendado", icon: "📅", color: "#45B7D1", desc: "Agendado" },
  { id: "publicado", label: "Publicado", icon: "🚀", color: "#5DE8A0", desc: "No ar!" },
];

export const POST_TYPES = [
  { id: "reel", label: "Reel", icon: "🎬", color: "#FF6B35" },
  { id: "carrossel", label: "Carrossel", icon: "📑", color: "#F7C948" },
  { id: "static", label: "Post", icon: "📄", color: "#4ECDC4" },
  { id: "roteiro", label: "Roteiro", icon: "📝", color: "#A78BFA" },
  { id: "collab", label: "Collab", icon: "🤝", color: "#45B7D1" },
  { id: "tirinha", label: "Tirinha", icon: "📰", color: "#FF8FAB" },
];

export const PILLARS = [
  { id: "provocativo", label: "Provocativo", color: "#FF6B35" },
  { id: "educativo", label: "Educativo", color: "#4ECDC4" },
  { id: "mba", label: "MBA", color: "#F7C948" },
  { id: "gestante", label: "Gestante", color: "#FF8FAB" },
  { id: "storytelling", label: "Storytelling", color: "#A78BFA" },
  { id: "bastidores", label: "Bastidores", color: "#5DE8A0" },
];

export const USERS = [
  { id: "rafael", name: "Rafael", role: "owner", avatar: "R", color: "#FF6B35", email: "" },
  { id: "editor", name: "Editor", role: "editor", avatar: "E", color: "#4ECDC4", email: "" },
];

export const CMS_STORAGE_KEY = "insta-pilates-cms";
export const POSTS_STORAGE_KEY = "insta-pilates-posts";
export const GEMINI_KEY_STORAGE = "insta-pilates-gemini-key";

export const CARD_FORM_FIELDS = [
  { id: "title", label: "Título" },
  { id: "notes", label: "Rascunho" },
  { id: "type", label: "Tipo de conteúdo" },
  { id: "tags", label: "Hashtags" },
  { id: "caption", label: "Legenda" },
  { id: "links", label: "Links" },
  { id: "attachments", label: "Anexos" },
  { id: "scheduledDate", label: "Data/Hora" },
  { id: "metrics", label: "Métricas Instagram" },
  { id: "column", label: "Status/Coluna" },
];

export function defaultCms() {
  return {
    columns: [...COLUMNS],
    postTypes: [...POST_TYPES],
    pillars: [...PILLARS],
    users: USERS.map((u) => ({ ...u, email: u.email || "" })),
    cardFormFieldIds: CARD_FORM_FIELDS.map((f) => f.id),
    readyColumnIds: ["agendado"],
    alertConfig: {
      scheduledEnabled: true,
      scheduledDaysAfter: 1,
      draftEnabled: true,
      draftDaysStale: 7,
      specialDatesDaysBefore: 12,
    },
    specialDates: [],
  };
}

export function loadCms() {
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(CMS_STORAGE_KEY) : null;
    if (!raw) return defaultCms();
    const p = JSON.parse(raw);
    return {
      columns: p.columns?.length ? p.columns : defaultCms().columns,
      postTypes: p.postTypes?.length ? p.postTypes : defaultCms().postTypes,
      pillars: p.pillars?.length ? p.pillars : defaultCms().pillars,
      users: p.users?.length ? p.users : defaultCms().users,
      cardFormFieldIds: Array.isArray(p.cardFormFieldIds) ? p.cardFormFieldIds : defaultCms().cardFormFieldIds,
      readyColumnIds: Array.isArray(p.readyColumnIds) ? p.readyColumnIds : defaultCms().readyColumnIds,
      alertConfig: { ...defaultCms().alertConfig, ...p.alertConfig },
      specialDates: Array.isArray(p.specialDates) ? p.specialDates : defaultCms().specialDates,
    };
  } catch (e) {
    return defaultCms();
  }
}

export function saveCms(cms) {
  try {
    typeof localStorage !== "undefined" && localStorage.setItem(CMS_STORAGE_KEY, JSON.stringify(cms));
  } catch (e) {}
}

export const POSTS = [];

export function loadPosts() {
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(POSTS_STORAGE_KEY) : null;
    if (!raw) return POSTS;
    return JSON.parse(raw);
  } catch (e) {
    return POSTS;
  }
}

export function savePosts(posts) {
  try {
    typeof localStorage !== "undefined" && localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(posts));
  } catch (e) {}
}

export const genId = () => "x" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
export const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) : "");
export const fmtNum = (n) => (n >= 1000 ? (n / 1000).toFixed(1) + "k" : String(n));

export const DAY_NAMES = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
export const DAY_NAMES_CAL = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function getWeekDates(b) {
  const d = new Date(b),
    day = d.getDay(),
    diff = d.getDate() - day + (day === 0 ? -6 : 1),
    mon = new Date(d.setDate(diff));
  return Array.from({ length: 7 }, (_, i) => {
    const dd = new Date(mon);
    dd.setDate(mon.getDate() + i);
    return dd;
  });
}

export const CSS = `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&family=JetBrains+Mono:wght@400;500&display=swap');*{margin:0;padding:0;box-sizing:border-box}html,body,#root{height:100%}::-webkit-scrollbar{width:5px;height:5px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.07);border-radius:3px}@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}@keyframes scaleIn{from{opacity:0;transform:scale(0.96)}to{opacity:1;transform:scale(1)}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}@keyframes typing{0%{opacity:0.3}50%{opacity:1}100%{opacity:0.3}}@keyframes glow{0%,100%{box-shadow:0 0 0 0 rgba(255,107,53,0)}50%{box-shadow:0 0 15px 3px rgba(255,107,53,0.15)}}@keyframes slideRight{from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:translateX(0)}}`;
