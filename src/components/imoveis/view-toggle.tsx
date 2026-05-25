import Link from "next/link";

import { buildPageHref } from "@/lib/format";

type Props = {
  currentView: "list" | "map";
  filters: Record<string, string | undefined>;
};

export function ViewToggle({ currentView, filters }: Props) {
  const baseFilters = { ...filters, page: "1" };
  const listHref = buildPageHref("/imoveis", { ...baseFilters, view: undefined });
  const mapHref = buildPageHref("/imoveis", { ...baseFilters, view: "map" });

  return (
    <div style={{
      display: "inline-flex",
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: "12px",
      padding: "4px",
      gap: "2px",
    }}>
      <Link href={listHref} style={toggleStyle(currentView === "list")}>
        📋 Lista
      </Link>
      <Link href={mapHref} style={toggleStyle(currentView === "map")}>
        🗺️ Mapa
      </Link>
    </div>
  );
}

function toggleStyle(active: boolean): React.CSSProperties {
  return {
    padding: "8px 16px",
    borderRadius: "9px",
    fontSize: "0.88rem",
    fontWeight: 600,
    textDecoration: "none",
    transition: "all 0.2s",
    color: active ? "#fff" : "rgba(255,255,255,0.6)",
    background: active ? "rgba(37,99,235,0.5)" : "transparent",
  };
}
