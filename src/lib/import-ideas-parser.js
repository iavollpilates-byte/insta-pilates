/**
 * Parser para importação em massa de ideias/posts conforme regras-separacao-posts.md
 * Regras 1–7: separador ^^^^^, múltiplos roteiros por bloco, tipos, adaptação, duplicatas, extração, limpeza.
 */

const SEPARATOR_CARETS = /^\^+$/;
const MULTI_ROTEIROS_MARKER = /\*AQUI TEM \d+ ROTEIROS\*|TEM \d+ ROTEIROS/i;
const ROTEIRO_HEADER = /Roteiro:\s*"([^"]*)"/i;
const CARROSSEL_HEADER = /CARROSSEL:\s*"([^"]*)"/i;
const ADAPTACAO_MARKER = /^(PRECISA DE ADAPTACAO|PRECISA DE ADAPTAÇÃO|ADAPTAR)\s*$/im;
const NOTAS_PRODUCAO_HEADER = /NOTAS DE PRODUÇÃO/i;
const CHECKLIST_EMOJI = /[1-9]️⃣/;
const CHECKLIST_BOX = /☐/;
const CHECKLIST_PERGUNTA = /Pergunta final:/i;

/**
 * Regra 1: Split por linha com 5+ circunflexos.
 */
function splitBySeparator(text) {
  const lines = text.split(/\r?\n/);
  const blocks = [];
  let current = [];
  for (const line of lines) {
    if (SEPARATOR_CARETS.test(line.trim()) && line.trim().length >= 5) {
      if (current.length > 0) {
        blocks.push(current.join("\n"));
        current = [];
      }
      continue;
    }
    current.push(line);
  }
  if (current.length > 0) blocks.push(current.join("\n"));
  return blocks;
}

/**
 * Regra 7: Remove linhas que são só ^^^^^ ou *AQUI TEM X ROTEIROS*.
 */
function cleanBlockLines(raw) {
  const lines = raw.split(/\r?\n/);
  return lines
    .filter((ln) => {
      const t = ln.trim();
      if (!t) return true;
      if (SEPARATOR_CARETS.test(t) && t.length >= 5) return false;
      if (/^\*AQUI TEM \d+ ROTEIROS\*$/i.test(t)) return false;
      return true;
    })
    .join("\n")
    .trim();
}

/**
 * Extrai título entre aspas após "Roteiro:" ou "CARROSSEL:" na primeira linha significativa.
 */
function extractTitleFromHeader(content) {
  const mR = content.match(ROTEIRO_HEADER);
  if (mR) return mR[1].trim();
  const mC = content.match(CARROSSEL_HEADER);
  if (mC) return mC[1].trim();
  const firstLine = content.split(/\r?\n/).find((l) => l.trim().length > 0);
  return firstLine ? firstLine.trim().slice(0, 120) : "Sem título";
}

/**
 * Detecta tipo do bloco: roteiro_video | carrossel | checklist | ideia
 */
function detectType(content) {
  const trimmed = content.trim();
  if (ROTEIRO_HEADER.test(trimmed)) return "roteiro_video";
  if (CARROSSEL_HEADER.test(trimmed)) return "carrossel";
  if (CHECKLIST_EMOJI.test(trimmed) || CHECKLIST_BOX.test(trimmed) || CHECKLIST_PERGUNTA.test(trimmed))
    return "checklist";
  return "ideia";
}

/**
 * Regra 2: Se bloco tem "AQUI TEM X ROTEIROS", divide por cada "Roteiro: \"título\"".
 */
function splitBlockIntoPosts(blockText) {
  const cleaned = cleanBlockLines(blockText);
  if (!cleaned) return [];

  const precisaAdaptacao = ADAPTACAO_MARKER.test(cleaned);

  if (MULTI_ROTEIROS_MARKER.test(cleaned)) {
    const parts = [];
    const regex = /Roteiro:\s*"[^"]*"/gi;
    let lastEnd = 0;
    let m;
    while ((m = regex.exec(cleaned)) !== null) {
      const start = m.index;
      if (start > lastEnd) {
        const between = cleaned.slice(lastEnd, start).trim();
        if (between && !MULTI_ROTEIROS_MARKER.test(between)) {
          parts.push({ raw: between, precisaAdaptacao });
        }
      }
      const titleMatch = cleaned.slice(start).match(/Roteiro:\s*"([^"]*)"/i);
      let end = cleaned.indexOf("Roteiro:", start + 1);
      if (end === -1) end = cleaned.length;
      const rawContent = cleaned.slice(start, end).trim();
      parts.push({ raw: rawContent, precisaAdaptacao });
      lastEnd = end;
    }
    return parts;
  }

  return [{ raw: cleaned, precisaAdaptacao }];
}

/**
 * Separa conteúdo principal da seção NOTAS DE PRODUÇÃO (e POR QUE... se quiser).
 */
function extractNotasProducao(content) {
  const idx = content.search(NOTAS_PRODUCAO_HEADER);
  if (idx === -1) return { conteudo: content.trim(), notas_producao: null };
  const conteudo = content.slice(0, idx).trim();
  const notas = content.slice(idx).trim();
  return { conteudo, notas_producao: notas || null };
}

/**
 * Regra 5: Marca duplicatas por título (mantém último como principal).
 */
function markDuplicates(parsed) {
  const byTitle = new Map();
  parsed.forEach((p, i) => {
    const key = (p.titulo || "").trim().toLowerCase();
    if (!key) return;
    if (byTitle.has(key)) {
      parsed[byTitle.get(key)].duplicata = true;
    }
    byTitle.set(key, i);
  });
  return parsed;
}

/**
 * Parse principal: texto bruto -> array de { titulo, tipo, conteudo, precisa_adaptacao?, duplicata?, notas_producao? }
 */
export function parseImportIdeasText(text) {
  if (!text || typeof text !== "string") return [];
  const rawBlocks = splitBySeparator(text);
  const parsed = [];

  for (const block of rawBlocks) {
    const posts = splitBlockIntoPosts(block);
    for (const { raw, precisaAdaptacao } of posts) {
      const conteudoClean = cleanBlockLines(raw);
      if (!conteudoClean) continue;

      const tipo = detectType(conteudoClean);
      const titulo = extractTitleFromHeader(conteudoClean);
      const { conteudo, notas_producao } = extractNotasProducao(conteudoClean);

      parsed.push({
        titulo: titulo || "Sem título",
        tipo,
        conteudo: conteudo || conteudoClean,
        precisa_adaptacao: !!precisaAdaptacao,
        duplicata: false,
        notas_producao,
      });
    }
  }

  return markDuplicates(parsed);
}
