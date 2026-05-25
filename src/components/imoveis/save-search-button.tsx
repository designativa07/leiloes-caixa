"use client";

import { useState } from "react";

type Filters = {
  search?: string;
  state?: string;
  city?: string;
  saleMode?: string;
  financing?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
};

type Props = {
  filters: Filters;
  loggedIn: boolean;
};

function hasAnyFilter(f: Filters): boolean {
  return Boolean(
    f.search || f.state || f.city || f.saleMode || f.financing || f.minPrice || f.maxPrice,
  );
}

export function SaveSearchButton({ filters, loggedIn }: Props) {
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState<string>("");

  if (!loggedIn) return null;
  if (!hasAnyFilter(filters)) return null;

  async function handleClick() {
    const name = window.prompt("Dê um nome para esta busca (ex: Apartamentos SC até 200k):");
    if (!name || !name.trim()) return;

    setStatus("saving");
    setMessage("");

    try {
      const payload = {
        search: filters.search || undefined,
        state: filters.state || undefined,
        city: filters.city || undefined,
        saleMode: filters.saleMode || undefined,
        financing: filters.financing || undefined,
        minPrice: filters.minPrice || undefined,
        maxPrice: filters.maxPrice || undefined,
        sort: filters.sort || undefined,
      };

      const response = await fetch("/api/saved-searches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), filters: payload }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Erro ${response.status}`);
      }

      setStatus("saved");
      setMessage(`Busca "${name.trim()}" salva. Você receberá emails quando aparecerem imóveis novos que batam com ela.`);
    } catch (err) {
      setStatus("error");
      setMessage((err as Error).message || "Erro ao salvar busca");
    }
  }

  const buttonStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    background: "rgba(34,197,94,0.1)",
    border: "1px solid rgba(34,197,94,0.3)",
    color: "#22c55e",
    fontSize: "0.85rem",
    fontWeight: 700,
    padding: "10px 18px",
    borderRadius: "12px",
    cursor: status === "saving" ? "wait" : "pointer",
    opacity: status === "saving" ? 0.6 : 1,
    transition: "all 0.2s",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
      <button type="button" onClick={handleClick} disabled={status === "saving"} style={buttonStyle}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 16, height: 16 }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
        {status === "saving" ? "Salvando..." : "Salvar esta busca"}
      </button>

      {message && (
        <div
          style={{
            fontSize: "0.82rem",
            color: status === "error" ? "#ef4444" : "#86efac",
            background: status === "error" ? "rgba(239,68,68,0.08)" : "rgba(34,197,94,0.08)",
            border: `1px solid ${status === "error" ? "rgba(239,68,68,0.2)" : "rgba(34,197,94,0.2)"}`,
            padding: "8px 12px",
            borderRadius: "8px",
            lineHeight: 1.5,
          }}
        >
          {message}
        </div>
      )}
    </div>
  );
}
