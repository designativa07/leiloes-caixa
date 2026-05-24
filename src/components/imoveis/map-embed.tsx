"use client";

type Props = {
  address: string;
  city: string;
  state: string;
};


export function MapEmbed({ address, city, state }: Props) {
  const query = encodeURIComponent(`${address}, ${city}, ${state}, Brasil`);
  const embedUrl = `https://maps.google.com/maps?q=${query}&output=embed&zoom=15`;
  const mapsUrl = `https://maps.google.com/maps?q=${query}`;

  return (
    <div style={{ marginTop: 32, borderTop: "1px solid var(--border)", paddingTop: 28 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
        <h2 className="section-title" style={{ margin: 0, fontSize: "1.2rem" }}>
          📍 Localização
        </h2>
        <a
          href={mapsUrl}
          target="_blank"
          rel="noreferrer"
          style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.25)",
            color: "#60a5fa", fontSize: "0.85rem", fontWeight: 600,
            padding: "7px 14px", borderRadius: "10px", textDecoration: "none",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(37,99,235,0.2)";
            e.currentTarget.style.color = "#93c5fd";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(37,99,235,0.1)";
            e.currentTarget.style.color = "#60a5fa";
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 15, height: 15 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
          Abrir no Google Maps
        </a>
      </div>

      <div style={{ borderRadius: "16px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.07)", boxShadow: "0 4px 24px rgba(0,0,0,0.3)" }}>
        <iframe
          src={embedUrl}
          width="100%"
          height="350"
          style={{ border: 0, display: "block" }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title={`Mapa: ${address}, ${city}, ${state}`}
        />
      </div>

      <p style={{ marginTop: 10, fontSize: "0.78rem", color: "rgba(255,255,255,0.3)", textAlign: "center" }}>
        Localização aproximada com base no endereço cadastrado
      </p>
    </div>
  );
}
