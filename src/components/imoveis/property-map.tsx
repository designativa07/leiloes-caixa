"use client";

import { useEffect, useRef } from "react";

import { formatCurrency, formatPercent, getPropertyImage } from "@/lib/format";
import type { MapProperty } from "@/lib/auction-items";
import type * as LType from "leaflet";

type Props = {
  items: MapProperty[];
  truncated: boolean;
  totalWithCoords: number;
};

export function PropertyMap({ items, truncated, totalWithCoords }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LType.Map | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function setup() {
      if (!containerRef.current || mapInstanceRef.current) return;

      const L = (await import("leaflet")).default;
      await import("leaflet.markercluster");

      if (cancelled || !containerRef.current) return;

      const map = L.map(containerRef.current);
      mapInstanceRef.current = map;

      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      const cluster = (L as unknown as { markerClusterGroup: () => LType.LayerGroup }).markerClusterGroup();

      const markers = items.map((item) => {
        const marker = L.marker([item.latitude, item.longitude]);
        const popupHtml = `
          <div style="min-width:180px;">
            <img src="${getPropertyImage(item.externalId)}" alt="" style="width:100%;height:100px;object-fit:cover;border-radius:8px;margin-bottom:8px;" onerror="this.style.display='none';" />
            <div style="font-weight:700;font-size:0.85rem;line-height:1.3;margin-bottom:4px;">${escapeHtml(item.address)}</div>
            <div style="font-size:0.75rem;color:#666;margin-bottom:6px;">${escapeHtml(item.city)}</div>
            <div style="font-weight:700;color:#16a34a;margin-bottom:2px;">${formatCurrency(item.price)}</div>
            ${item.discountPercent ? `<div style="font-size:0.75rem;color:#16a34a;">${formatPercent(item.discountPercent)} OFF</div>` : ""}
            <a href="/imoveis/${item.id}" style="display:inline-block;margin-top:8px;color:#2563eb;font-size:0.8rem;font-weight:600;text-decoration:none;">Ver detalhes →</a>
          </div>
        `;
        marker.bindPopup(popupHtml);
        cluster.addLayer(marker);
        return marker;
      });

      map.addLayer(cluster);

      const bounds = L.featureGroup(markers).getBounds();
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }

    setup();

    return () => {
      cancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [items]);

  return (
    <div>
      {truncated && (
        <div style={{
          background: "rgba(245, 158, 11, 0.1)",
          border: "1px solid rgba(245, 158, 11, 0.3)",
          color: "#fbbf24",
          padding: "10px 14px",
          borderRadius: "10px",
          fontSize: "0.85rem",
          marginBottom: 12,
        }}>
          Mostrando {items.length.toLocaleString("pt-BR")} de {totalWithCoords.toLocaleString("pt-BR")} imóveis no mapa. Refine os filtros para ver todos.
        </div>
      )}
      {items.length === 0 ? (
        <div className="muted" style={{
          textAlign: "center",
          padding: "60px 20px",
          background: "rgba(255,255,255,0.02)",
          border: "1px dashed rgba(255,255,255,0.08)",
          borderRadius: "16px",
        }}>
          Nenhum imóvel com coordenadas para os filtros atuais. O geocoding pode ainda estar em andamento.
        </div>
      ) : (
        <div
          ref={containerRef}
          style={{
            width: "100%",
            height: "600px",
            borderRadius: "16px",
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        />
      )}
    </div>
  );
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
