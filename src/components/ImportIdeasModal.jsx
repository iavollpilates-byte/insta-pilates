"use client";

import { useState, useRef } from "react";
import { T, genId } from "@/lib/theme-tokens";
import { parseImportIdeasText } from "@/lib/import-ideas-parser";

export default function ImportIdeasModal({ onClose, setPosts, user, savePostToBackend }) {
  const [pasteText, setPasteText] = useState("");
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);
  const TYPE_MAP = { roteiro_video: "reel", carrossel: "carrossel", ideia: "static", checklist: "static" };

  const runImport = (text) => {
    setError(null);
    setResult(null);
    const trimmed = (text || "").trim();
    if (!trimmed) {
      setError("Digite ou envie um arquivo .txt com o conteúdo (blocos separados por ^^^^^).");
      return;
    }
    const parsed = parseImportIdeasText(trimmed);
    if (!parsed.length) {
      setError('Nenhum post encontrado. Use blocos separados por ^^^^^ e marcadores como Roteiro: "título" ou CARROSSEL: "título".');
      return;
    }
    const now = new Date().toISOString();
    const newPosts = parsed.map((p) => {
      const title = [p.precisa_adaptacao && "[Adaptar]", p.duplicata && "[Duplicata]", p.titulo].filter(Boolean).join(" ").trim() || p.titulo;
      let notes = p.conteudo || "";
      if (p.notas_producao) notes += "\n\n" + p.notas_producao;
      if (p.precisa_adaptacao) notes += "\n\n[Precisa adaptação]";
      if (p.duplicata) notes += "\n\n[Duplicata]";
      return {
        id: genId(),
        column: "ideias_rascunhos",
        type: TYPE_MAP[p.tipo] || "static",
        title,
        caption: "",
        tags: [],
        assignee: user.id,
        createdBy: user.id,
        createdAt: now,
        updatedAt: now,
        scheduledDate: null,
        scheduledTime: null,
        engagement: null,
        notes,
        links: [],
        attachments: [],
        aiScore: null,
        aiSuggestion: null,
      };
    });
    setPosts((prev) => [...prev, ...newPosts]);
    newPosts.forEach((p) => {
      if (savePostToBackend) savePostToBackend(p).catch(() => {});
    });
    setResult(newPosts.length);
    setPasteText("");
  };

  const onFileChange = (e) => {
    const file = e.target?.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPasteText(reader.result || "");
      setError(null);
    };
    reader.readAsText(file, "utf-8");
    e.target.value = "";
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Importar ideias em massa"
        style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, padding: 24, minWidth: 420, maxWidth: "90vw", maxHeight: "85vh", display: "flex", flexDirection: "column", animation: "scaleIn 0.2s", boxShadow: "0 20px 50px rgba(0,0,0,0.15)" }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
      >
        <h3 style={{ fontSize: 16, fontWeight: 800, color: T.text, margin: "0 0 8px" }}>Importar ideias em massa</h3>
        <p style={{ fontSize: 12, color: T.textMuted, marginBottom: 14 }}>Use um .txt com blocos separados por ^^^^^ ou cole o texto abaixo. Cada bloco vira um card em Ideias e Rascunhos.</p>
        <input ref={fileInputRef} type="file" accept=".txt" style={{ display: "none" }} onChange={onFileChange} />
        <button type="button" onClick={() => fileInputRef.current?.click()} style={{ padding: "8px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, border: `1px solid ${T.accentBorder}`, background: T.accentGlow, color: T.accent, cursor: "pointer", marginBottom: 12, alignSelf: "flex-start" }}>Enviar arquivo .txt</button>
        <textarea
          value={pasteText}
          onChange={(e) => setPasteText(e.target.value)}
          placeholder={'Cole aqui o conteúdo (blocos separados por ^^^^^, use Roteiro: "título" ou CARROSSEL: "título")...'}
          style={{ width: "100%", minHeight: 160, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 12px", color: T.text, fontSize: 12, fontFamily: T.font, resize: "vertical", outline: "none", marginBottom: 10 }}
        />
        {error && <p style={{ fontSize: 12, color: T.red, marginBottom: 10 }}>{error}</p>}
        {result !== null && <p style={{ fontSize: 12, color: T.green, marginBottom: 10 }}>{result} ideias importadas para Ideias e Rascunhos.</p>}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
          <button type="button" onClick={onClose} style={{ padding: "8px 14px", borderRadius: 8, fontSize: 12, border: `1px solid ${T.border}`, background: "transparent", color: T.textMuted, cursor: "pointer" }}>Fechar</button>
          <button type="button" onClick={() => runImport(pasteText)} style={{ padding: "8px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, border: "none", background: T.accent, color: T.accentText, cursor: "pointer" }}>Importar</button>
        </div>
      </div>
    </div>
  );
}
