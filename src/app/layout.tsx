import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Leilões Caixa SC",
  description: "Visualize imoveis de leilao da Caixa de forma simples e responsiva.",
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
