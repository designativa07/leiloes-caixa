import { formatAuctionDate } from "@/lib/format";

type Props = {
  auctionDate: Date | null;
  auctionDateType: string | null;
  saleMode: string;
};

export function AuctionDateCard({ auctionDate, auctionDateType, saleMode }: Props) {
  const info = formatAuctionDate(auctionDate, auctionDateType);

  return (
    <section className="detail-card">
      <h2 className="section-title">Detalhes do Leilão</h2>

      {info.kind === "date" && (
        <div className="detail-list">
          <div>
            <span className="muted font-small">Data</span>
            <div style={{ fontWeight: 700, fontSize: "1.2rem", color: "#fbbf24" }}>
              {info.primary}
              {auctionDate && new Date(auctionDate).getUTCHours() > 0 && (
                <span style={{ fontWeight: 500, fontSize: "1rem", marginLeft: 8 }}>
                  às {new Date(auctionDate).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" })}
                </span>
              )}
            </div>
          </div>
          <div>
            <span className="muted font-small">Tipo</span>
            <div style={{ fontWeight: 600 }}>{info.secondary}</div>
          </div>
          <div>
            <span className="muted font-small">Modalidade</span>
            <div style={{ fontWeight: 600 }}>{saleMode}</div>
          </div>
        </div>
      )}

      {info.kind === "continua" && (
        <div className="detail-list">
          <div>
            <span className="muted font-small">Modalidade</span>
            <div style={{ fontWeight: 700 }}>{saleMode}</div>
          </div>
          <div style={{ marginTop: 12, padding: "12px 14px", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: "10px", fontSize: "0.88rem", color: "#86efac" }}>
            Imóvel disponível para compra direta até ser comercializado. Não há data de leilão específica.
          </div>
        </div>
      )}

      {info.kind === "none" && (
        <div className="detail-list">
          <div>
            <span className="muted font-small">Modalidade</span>
            <div style={{ fontWeight: 700 }}>{saleMode}</div>
          </div>
          <div className="muted" style={{ fontSize: "0.85rem", marginTop: 8 }}>
            Data de leilão ainda não disponível. Consulte o anúncio oficial na Caixa.
          </div>
        </div>
      )}
    </section>
  );
}
