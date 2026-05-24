import { signIn } from "@/lib/auth";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Entrar — Leilões Caixa" };

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  return (
    <main style={{ minHeight: "calc(100vh - 60px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
      <div style={{
        background: "rgba(15, 22, 36, 0.7)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "28px",
        padding: "48px 40px",
        width: "100%",
        maxWidth: "420px",
        backdropFilter: "blur(12px)",
        boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
        textAlign: "center",
      }}>
        <div style={{
          width: "56px", height: "56px", borderRadius: "16px",
          background: "linear-gradient(135deg, #2563eb, #3b82f6)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 24px",
          boxShadow: "0 0 20px rgba(37,99,235,0.4)",
        }}>
          <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 28, height: 28, color: "#fff" }}>
            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
          </svg>
        </div>

        <h1 style={{ fontSize: "1.8rem", fontWeight: 800, letterSpacing: "-0.03em", color: "#fff", marginBottom: "8px" }}>
          Bem-vindo
        </h1>
        <p style={{ color: "#9ca3af", fontSize: "1rem", lineHeight: 1.6, marginBottom: "36px" }}>
          Entre com sua conta Google para salvar favoritos e receber alertas de novos imóveis.
        </p>

        <form
          action={async () => {
            "use server";
            const params = await searchParams;
            await signIn("google", { redirectTo: params.callbackUrl ?? "/imoveis" });
          }}
        >
          <button
            type="submit"
            style={{
              width: "100%",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "12px",
              background: "#fff", color: "#111", border: "none",
              borderRadius: "14px", padding: "14px 24px", cursor: "pointer",
              fontWeight: 700, fontSize: "1rem", transition: "all 0.25s",
              boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            }}
          >
            <svg viewBox="0 0 24 24" style={{ width: 20, height: 20, flexShrink: 0 }}>
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuar com Google
          </button>
        </form>

        <p style={{ marginTop: "28px", color: "#4b5563", fontSize: "0.8rem", lineHeight: 1.6 }}>
          Ao entrar, você concorda com os Termos de Uso.<br />
          Não armazenamos senhas — usamos login seguro via Google.
        </p>
      </div>
    </main>
  );
}
