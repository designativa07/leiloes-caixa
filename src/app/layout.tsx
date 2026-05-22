import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Portal de Leilões Caixa - Todos os Estados",
  description: "Consulte e filtre de forma simples, rápida e responsiva milhares de imóveis em leilão da Caixa Econômica Federal em todo o Brasil.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
