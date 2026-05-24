"use client";

import { useRouter } from "next/navigation";

export function BackButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className="back-link"
      style={{ background: "none", border: "none", cursor: "pointer", padding: 0, font: "inherit" }}
    >
      &larr; Voltar para a listagem de imóveis
    </button>
  );
}
