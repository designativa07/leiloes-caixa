"use client";

import { useState, useEffect, useCallback } from "react";

const PHOTO_INDICES = [1, 2, 3, 4, 5, 6, 7, 8, 9];

function getPhotoUrl(externalId: string, index: number): string {
  const paddedId = (externalId ?? "").trim().padStart(13, "0");
  return `https://venda-imoveis.caixa.gov.br/fotos/F${paddedId}${index}1.jpg`;
}

type Photo = { index: number; url: string };

type Props = {
  externalId: string;
  alt: string;
  discountPercent?: number;
};

export function PropertyGallery({ externalId, alt, discountPercent }: Props) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [current, setCurrent] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [probing, setProbing] = useState(true);

  // Probe all photo URLs simultaneously on mount
  useEffect(() => {
    const found: Photo[] = [];
    let pending = PHOTO_INDICES.length;

    PHOTO_INDICES.forEach((index) => {
      const url = getPhotoUrl(externalId, index);
      const img = new window.Image();
      img.onload = () => {
        found.push({ index, url });
        pending--;
        if (pending === 0) {
          found.sort((a, b) => a.index - b.index);
          setPhotos(found);
          setProbing(false);
        }
      };
      img.onerror = () => {
        pending--;
        if (pending === 0) {
          found.sort((a, b) => a.index - b.index);
          setPhotos(found);
          setProbing(false);
        }
      };
      img.src = url;
    });
  }, [externalId]);

  const prev = useCallback(() => setCurrent((c) => (c - 1 + photos.length) % photos.length), [photos.length]);
  const next = useCallback(() => setCurrent((c) => (c + 1) % photos.length), [photos.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!lightbox) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(false);
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightbox, prev, next]);

  const mainPhoto = photos[current];
  const hasMultiple = photos.length > 1;

  return (
    <>
      {/* ── Main gallery area ── */}
      <div style={{ position: "relative", width: "100%", background: "rgba(10,14,26,0.8)" }}>
        {/* Main image */}
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "420px",
            overflow: "hidden",
            cursor: probing ? "default" : "zoom-in",
          }}
          onClick={() => !probing && mainPhoto && setLightbox(true)}
        >
          {probing ? (
            // Skeleton while probing
            <div style={{
              width: "100%", height: "100%",
              background: "linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.03) 75%)",
              backgroundSize: "200% 100%",
              animation: "shimmer 1.5s infinite",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1} style={{ width: 48, height: 48, color: "rgba(255,255,255,0.1)" }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
            </div>
          ) : mainPhoto ? (
            <img
              src={mainPhoto.url}
              alt={`${alt} — foto ${current + 1}`}
              style={{ width: "100%", height: "100%", objectFit: "contain", padding: "10px", transition: "opacity 0.3s" }}
            />
          ) : (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "rgba(255,255,255,0.2)", fontSize: "0.9rem" }}>Sem foto disponível</span>
            </div>
          )}

          {/* Discount badge */}
          {discountPercent && discountPercent > 0 && (
            <span style={{
              position: "absolute", bottom: 16, right: 16, zIndex: 10,
              background: "linear-gradient(135deg,#16a34a,#15803d)",
              color: "#fff", fontWeight: 800, fontSize: "1rem",
              padding: "7px 14px", borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(22,163,74,0.4)",
              pointerEvents: "none",
            }}>
              {discountPercent.toFixed(0)}% ECONOMIA
            </span>
          )}

          {/* Photo counter */}
          {!probing && photos.length > 0 && (
            <span style={{
              position: "absolute", bottom: 16, left: 16, zIndex: 10,
              background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)",
              color: "#fff", fontSize: "0.78rem", fontWeight: 600,
              padding: "4px 10px", borderRadius: "99px",
              pointerEvents: "none",
            }}>
              📷 {photos.length} foto{photos.length > 1 ? "s" : ""}
            </span>
          )}

          {/* Nav arrows */}
          {hasMultiple && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prev(); }}
                style={arrowStyle("left")}
                aria-label="Foto anterior"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} style={{ width: 20, height: 20 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); next(); }}
                style={arrowStyle("right")}
                aria-label="Próxima foto"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} style={{ width: 20, height: 20 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </>
          )}

          {/* Zoom hint */}
          {!probing && mainPhoto && (
            <span style={{
              position: "absolute", top: 12, right: 12,
              background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)",
              color: "rgba(255,255,255,0.7)", fontSize: "0.7rem",
              padding: "4px 8px", borderRadius: "8px", pointerEvents: "none",
            }}>
              🔍 clique para ampliar
            </span>
          )}
        </div>

        {/* Thumbnail strip */}
        {hasMultiple && (
          <div style={{
            display: "flex", gap: "8px", padding: "12px 16px",
            overflowX: "auto", borderTop: "1px solid rgba(255,255,255,0.05)",
            background: "rgba(0,0,0,0.3)",
          }}>
            {photos.map((photo, i) => (
              <button
                key={photo.index}
                onClick={() => setCurrent(i)}
                style={{
                  flexShrink: 0,
                  width: "72px", height: "54px",
                  border: i === current ? "2px solid #3b82f6" : "2px solid rgba(255,255,255,0.08)",
                  borderRadius: "8px", overflow: "hidden",
                  padding: 0, cursor: "pointer",
                  opacity: i === current ? 1 : 0.55,
                  transition: "all 0.2s",
                  background: "rgba(0,0,0,0.4)",
                }}
              >
                <img
                  src={photo.url}
                  alt={`Miniatura ${i + 1}`}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Lightbox ── */}
      {lightbox && mainPhoto && (
        <div
          onClick={() => setLightbox(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(0,0,0,0.95)", backdropFilter: "blur(8px)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <img
            src={mainPhoto.url}
            alt={alt}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "95vw", maxHeight: "92vh",
              objectFit: "contain", borderRadius: "12px",
              boxShadow: "0 0 80px rgba(0,0,0,0.8)",
            }}
          />

          {/* Close */}
          <button
            onClick={() => setLightbox(false)}
            style={{
              position: "fixed", top: 20, right: 20,
              width: 44, height: 44, borderRadius: "50%",
              background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)",
              color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            }}
            aria-label="Fechar"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 20, height: 20 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Lightbox arrows */}
          {hasMultiple && (
            <>
              <button onClick={(e) => { e.stopPropagation(); prev(); }} style={{ ...arrowStyle("left"), position: "fixed", left: 20 }} aria-label="Anterior">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} style={{ width: 22, height: 22 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>
              <button onClick={(e) => { e.stopPropagation(); next(); }} style={{ ...arrowStyle("right"), position: "fixed", right: 20 }} aria-label="Próxima">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} style={{ width: 22, height: 22 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </>
          )}

          {/* Counter */}
          <div style={{
            position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
            background: "rgba(0,0,0,0.6)", color: "#fff", fontSize: "0.85rem",
            padding: "6px 16px", borderRadius: "99px", fontWeight: 600,
          }}>
            {current + 1} / {photos.length}
          </div>
        </div>
      )}

      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </>
  );
}

function arrowStyle(side: "left" | "right"): React.CSSProperties {
  return {
    position: "absolute",
    top: "50%",
    [side]: "12px",
    transform: "translateY(-50%)",
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    background: "rgba(0,0,0,0.55)",
    backdropFilter: "blur(8px)",
    border: "1px solid rgba(255,255,255,0.12)",
    color: "#fff",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    transition: "background 0.2s, transform 0.2s",
  };
}
