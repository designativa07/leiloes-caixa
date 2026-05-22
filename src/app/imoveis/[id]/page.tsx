import Link from "next/link";
import { notFound } from "next/navigation";

import { db } from "@/lib/db";
import { formatCurrency, formatFinancing, formatPercent, getPropertyImage } from "@/lib/format";
import { PropertyImage } from "@/components/imoveis/property-image";

type Params = Promise<{ id: string }>;

export default async function PropertyDetailPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;

  const item = await db.auctionItem.findUnique({
    where: {
      id: Number(id),
    },
  });

  if (!item) {
    notFound();
  }

  const imageUrl = getPropertyImage(item.externalId);

  return (
    <main className="page-shell">
      <div className="container">
        <Link className="back-link" href="/imoveis">
          &larr; Voltar para a listagem de imóveis
        </Link>

        <div className="detail-grid">
          <section className="detail-card main-detail-card" style={{ overflow: "hidden", padding: 0 }}>
            <div className="detail-image-hero-wrapper" style={{ position: "relative", width: "100%", height: "400px", background: "rgba(15, 23, 42, 0.6)", borderBottom: "1px solid var(--border)" }}>
              <a
                href={imageUrl}
                target="_blank"
                rel="noreferrer"
                title="Clique para abrir a foto em tamanho real"
                style={{ display: "block", width: "100%", height: "100%", cursor: "zoom-in" }}
              >
                <PropertyImage
                  src={imageUrl}
                  alt={item.address}
                  style={{ width: "100%", height: "100%", objectFit: "contain", padding: "10px" }}
                  height="400px"
                />
              </a>
              {Number(item.discountPercent) > 0 ? (
                <span className="badge-discount-float" style={{ position: "absolute", top: "auto", bottom: 20, right: 20, zIndex: 10, fontSize: "1.1rem", padding: "8px 16px", pointerEvents: "none" }}>
                  {formatPercent(Number(item.discountPercent))} ECONOMIA
                </span>
              ) : null}
            </div>

            <div style={{ padding: "30px" }}>
              <div className="detail-badges" style={{ marginBottom: 16 }}>
                <span className="badge badge-state">{item.state}</span>
                <span className="badge">{item.city}</span>
                <span className="badge">{item.district}</span>
                <span className="badge">{item.saleMode}</span>
              </div>

              <h1 className="detail-title" style={{ fontSize: "2rem", marginBottom: 10, lineHeight: 1.3 }}>{item.address}</h1>
              <p className="muted" style={{ marginBottom: 30, fontSize: "1.1rem" }}>
                {item.city} - {item.state}
              </p>

              <div className="detail-list-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20, borderTop: "1px solid var(--border)", paddingTop: 24 }}>
                <div>
                  <div className="muted font-small">Código do Imóvel</div>
                  <strong style={{ fontSize: "1.1rem" }}>{item.externalId}</strong>
                </div>
                <div>
                  <div className="muted font-small">Preço de Venda</div>
                  <strong style={{ fontSize: "1.5rem", color: "var(--success)" }}>{formatCurrency(Number(item.price))}</strong>
                </div>
                <div>
                  <div className="muted font-small">Valor de Avaliação</div>
                  <strong style={{ fontSize: "1.1rem" }}>{formatCurrency(Number(item.appraisalValue ?? 0))}</strong>
                </div>
                <div>
                  <div className="muted font-small">Financiamento</div>
                  <strong style={{ fontSize: "1.1rem" }}>{formatFinancing(item.allowsFinancing)}</strong>
                </div>
              </div>

              <div style={{ marginTop: 35, borderTop: "1px solid var(--border)", paddingTop: 24 }}>
                <h2 className="section-title" style={{ fontSize: "1.3rem", marginBottom: 12 }}>Descrição do Imóvel</h2>
                <div className="detail-description">{item.description}</div>
              </div>
            </div>
          </section>

          <aside className="detail-sidebar">
            <section className="detail-card">
              <h2 className="section-title">Resumo rapido</h2>
              <div className="detail-list">
                <div>
                  <strong>Categoria:</strong> Imovel
                </div>
                <div>
                  <strong>Origem:</strong> Caixa
                </div>
                <div>
                  <strong>Modalidade:</strong> {item.saleMode}
                </div>
                <div>
                  <strong>Importacao:</strong> {item.importBatch}
                </div>
              </div>
            </section>

            <section className="detail-card">
              <h2 className="section-title">Acao</h2>
              <a className="card-link" href={item.sourceUrl} rel="noreferrer" target="_blank">
                Abrir anuncio oficial
              </a>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
