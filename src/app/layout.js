import "./globals.css";

export const metadata = {
  title: "CORATERIA — Gestão de Conteúdo Instagram",
  description: "Planeje, organize e analise seu conteúdo de Pilates no Instagram com IA",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
