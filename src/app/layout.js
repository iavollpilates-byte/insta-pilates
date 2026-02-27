import "./globals.css";

export const metadata = {
  title: "CORATERIA — Gestão de Conteúdo Instagram",
  description: "Planeje, organize e analise seu conteúdo de Pilates no Instagram com IA",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://corateria.vercel.app"),
  openGraph: {
    title: "CORATERIA — Gestão de Conteúdo Instagram",
    description: "Planeje, organize e analise seu conteúdo de Pilates no Instagram com IA",
    type: "website",
    locale: "pt_BR",
  },
  twitter: {
    card: "summary_large_image",
    title: "CORATERIA — Gestão de Conteúdo Instagram",
    description: "Planeje, organize e analise seu conteúdo de Pilates no Instagram com IA",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
