"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

type FavoriteButtonProps = {
  itemId: number;
  size?: "sm" | "lg";
};

export function FavoriteButton({ itemId, size = "sm" }: FavoriteButtonProps) {
  const { data: session } = useSession();
  const [favorited, setFavorited] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!session?.user) return;
    fetch(`/api/favorites/${itemId}`)
      .then((r) => r.json())
      .then((data) => {
        setFavorited(data.favorited);
        setChecked(true);
      });
  }, [itemId, session]);

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!session?.user) {
      window.location.href = "/login";
      return;
    }

    setLoading(true);
    const method = favorited ? "DELETE" : "POST";
    await fetch(`/api/favorites/${itemId}`, { method });
    setFavorited(!favorited);
    setLoading(false);
  };

  const iconSize = size === "lg" ? 22 : 18;
  const btnSize = size === "lg" ? "44px" : "34px";

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={favorited ? "Remover dos favoritos" : "Salvar nos favoritos"}
      aria-label={favorited ? "Remover dos favoritos" : "Salvar nos favoritos"}
      style={{
        width: btnSize,
        height: btnSize,
        borderRadius: "50%",
        border: `1px solid ${favorited ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.1)"}`,
        background: favorited ? "rgba(239,68,68,0.12)" : "rgba(255,255,255,0.05)",
        color: favorited ? "#ef4444" : "rgba(255,255,255,0.4)",
        cursor: loading ? "wait" : "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.2s cubic-bezier(0.4,0,0.2,1)",
        flexShrink: 0,
        opacity: checked || !session ? 1 : 0,
        transform: loading ? "scale(0.9)" : "scale(1)",
      }}
      onMouseEnter={(e) => {
        if (!favorited) e.currentTarget.style.color = "#ef4444";
        e.currentTarget.style.transform = "scale(1.1)";
      }}
      onMouseLeave={(e) => {
        if (!favorited) e.currentTarget.style.color = "rgba(255,255,255,0.4)";
        e.currentTarget.style.transform = "scale(1)";
      }}
    >
      <svg
        viewBox="0 0 24 24"
        fill={favorited ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={favorited ? 0 : 2}
        style={{ width: iconSize, height: iconSize, transition: "all 0.2s" }}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
        />
      </svg>
    </button>
  );
}
