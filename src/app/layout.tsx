import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/layout/providers";
import { Header } from "@/components/layout/header";

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
      <body>
        <Providers>
          <Header />
          {children}
        </Providers>
      </body>
    </html>
  );
}
