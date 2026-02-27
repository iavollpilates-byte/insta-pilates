/**
 * API Route para Gemini — chave fica no servidor (GEMINI_API_KEY).
 * POST body: { prompt: string, systemInstruction?: string }
 * Retorna: { text: string } ou { error: string }
 */
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

export async function POST(request) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return Response.json(
      { error: "GEMINI_API_KEY não configurada no servidor. Defina a variável de ambiente (ex.: na Vercel)." },
      { status: 503 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body JSON inválido" }, { status: 400 });
  }

  const prompt = body?.prompt ?? body?.text;
  if (!prompt || typeof prompt !== "string") {
    return Response.json({ error: "Campo 'prompt' (string) é obrigatório" }, { status: 400 });
  }

  const payload = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2048,
    },
  };
  if (body.systemInstruction && typeof body.systemInstruction === "string") {
    payload.systemInstruction = { parts: [{ text: body.systemInstruction }] };
  }

  try {
    const res = await fetch(`${GEMINI_URL}?key=${encodeURIComponent(key)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = data?.error?.message || data?.message || res.statusText;
      return Response.json({ error: msg || "Erro ao chamar Gemini" }, { status: res.status >= 500 ? 502 : 400 });
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    return Response.json({ text });
  } catch (err) {
    return Response.json(
      { error: err?.message || "Erro de rede ao chamar Gemini" },
      { status: 502 }
    );
  }
}
