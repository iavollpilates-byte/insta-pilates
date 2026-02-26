import "./globals.css";

export const metadata = {
  title: "PilatesPool — Gestão de Conteúdo Instagram",
  description: "Planeje, organize e analise seu conteúdo de Pilates no Instagram com IA",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
