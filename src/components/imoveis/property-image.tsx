"use client";

import { useState } from "react";

type PropertyImageProps = {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  loading?: "lazy" | "eager";
  height?: string;
};

export function PropertyImage({
  src,
  alt,
  className,
  style,
  loading = "lazy",
  height = "100%",
}: PropertyImageProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className="property-card-placeholder" style={{ ...style, height, display: "flex" }}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="placeholder-icon"
          style={{ width: "36px", height: "36px" }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h18M12 3v18"
          />
        </svg>
        <span className="placeholder-text" style={{ fontSize: "0.75rem" }}>
          Foto não disponível
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      loading={loading}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
    />
  );
}
