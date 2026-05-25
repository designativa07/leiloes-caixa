"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = { id: number; name: string };

export function DeleteSearchButton({ id, name }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    if (!confirm(`Excluir busca "${name}"? Você não receberá mais emails para esta busca.`)) return;

    setBusy(true);
    try {
      const response = await fetch(`/api/saved-searches?id=${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error(`Erro ${response.status}`);
      router.refresh();
    } catch (err) {
      alert(`Falha ao excluir: ${(err as Error).message}`);
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={busy}
      style={{
        background: "rgba(239,68,68,0.1)",
        border: "1px solid rgba(239,68,68,0.3)",
        color: "#ef4444",
        padding: "8px 14px",
        borderRadius: "10px",
        cursor: busy ? "wait" : "pointer",
        fontSize: "0.85rem",
        fontWeight: 600,
        opacity: busy ? 0.6 : 1,
      }}
    >
      {busy ? "Excluindo..." : "Excluir"}
    </button>
  );
}
