import Link from "next/link";
import { notFound } from "next/navigation";

import { db } from "@/lib/db";
import { formatCurrency, formatFinancing, formatPercent } from "@/lib/format";
import { FavoriteButton } from "@/components/imoveis/favorite-button";
import { PropertyGallery } from "@/components/imoveis/property-gallery";
import { MapEmbed } from "@/components/imoveis/map-embed";
import { BackButton } from "@/components/imoveis/back-button";

type Params = Promise<{ id: string }>;

export default async function PropertyDetailPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;

  const item = await db.auctionItem.findUnique({
    where: { id: Number(id) },
  });

  if (!item) notFound();

  return (
    <main className="page-shell">
      <div className="container">
        <BackButton />

        <div className="detail-grid">
          {/* ── Main card ── */}
          <section className="detail-card main-detail-card" style={{ overflow: "hidden", padding: 0 }}>
            {/* Gallery (multi-photo + lightbox) */}
            <PropertyGallery
              externalId={item.externalId}
              alt={item.address}
              discountPercent={item.discountPercent ? Number(item.discountPercent) : undefined}
            />

            <div style={{ padding: "30px" }}>
              {/* Badges + favorite */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", marginBottom: 16 }}>
                <div className="detail-badges" style={{ marginBottom: 0 }}>
                  <span className="badge badge-state">{item.state}</span>
                  <span className="badge">{item.city}</span>
                  <span className="badge">{item.district}</span>
                  <span className="badge">{item.saleMode}</span>
                </div>
                <FavoriteButton itemId={item.id} size="lg" />
              </div>

              <h1 className="detail-title" style={{ fontSize: "2rem", marginBottom: 10, lineHeight: 1.3 }}>{item.address}</h1>
              <p className="muted" style={{ marginBottom: 30, fontSize: "1.1rem" }}>
                {item.city} — {item.state}
              </p>

              {/* Key metrics */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: 20,
                borderTop: "1px solid var(--border)",
                paddingTop: 24,
              }}>
                <div>
                  <div className="muted font-small">Código do Imóvel</div>
                  <strong style={{ fontSize: "1.1rem" }}>{item.externalId}</strong>
                </div>
                <div>
                  <div className="muted font-small">Preço de Venda</div>
                  <strong style={{ fontSize: "1.5rem", color: "var(--success)" }}>{formatCurrency(Number(item.price))}</strong>
                </div>
                <div>
                  <div className="muted font-small">Avaliação</div>
                  <strong style={{ fontSize: "1.1rem" }}>{formatCurrency(Number(item.appraisalValue ?? 0))}</strong>
                </div>
                {item.discountPercent && Number(item.discountPercent) > 0 && (
                  <div>
                    <div className="muted font-small">Desconto</div>
                    <strong style={{ fontSize: "1.3rem", color: "#22c55e" }}>{formatPercent(Number(item.discountPercent))}</strong>
                  </div>
                )}
                <div>
                  <div className="muted font-small">Financiamento</div>
                  <strong style={{ fontSize: "1.1rem" }}>{formatFinancing(item.allowsFinancing)}</strong>
                </div>
              </div>

              {/* Description */}
              <div style={{ marginTop: 35, borderTop: "1px solid var(--border)", paddingTop: 24 }}>
                <h2 className="section-title" style={{ fontSize: "1.3rem", marginBottom: 12 }}>Descrição do Imóvel</h2>
                <div className="detail-description">{item.description}</div>
              </div>

              {/* Map */}
              <MapEmbed address={item.address} city={item.city} state={item.state} />
            </div>
          </section>

          {/* ── Sidebar ── */}
          <aside className="detail-sidebar">
            <section className="detail-card">
              <h2 className="section-title">Resumo</h2>
              <div className="detail-list">
                <div><strong>Modalidade:</strong> {item.saleMode}</div>
                <div><strong>Bairro:</strong> {item.district}</div>
                <div><strong>Cidade:</strong> {item.city} — {item.state}</div>
                <div><strong>Origem:</strong> Caixa Econômica Federal</div>
                <div><strong>Código:</strong> {item.externalId}</div>
              </div>
            </section>

            <section className="detail-card">
              <h2 className="section-title">Ação</h2>
              <a className="card-link" href={item.sourceUrl} rel="noreferrer" target="_blank">
                🏛️ Ver anúncio oficial na Caixa
              </a>
            </section>

            {/* Price breakdown */}
            {item.appraisalValue && Number(item.appraisalValue) > 0 && (
              <section className="detail-card">
                <h2 className="section-title">Análise de Preço</h2>
                <div className="detail-list">
                  <div>
                    <span className="muted font-small">Preço de venda</span>
                    <div style={{ fontWeight: 700, color: "var(--success)", fontSize: "1.2rem" }}>
                      {formatCurrency(Number(item.price))}
                    </div>
                  </div>
                  <div>
                    <span className="muted font-small">Valor avaliado</span>
                    <div style={{ fontWeight: 600 }}>{formatCurrency(Number(item.appraisalValue))}</div>
                  </div>
                  {item.discountPercent && Number(item.discountPercent) > 0 && (
                    <div>
                      <span className="muted font-small">Economia</span>
                      <div style={{ fontWeight: 700, color: "#22c55e", fontSize: "1.3rem" }}>
                        {formatPercent(Number(item.discountPercent))} OFF
                      </div>
                      <div className="muted font-small">
                        = {formatCurrency(Number(item.appraisalValue) - Number(item.price))} a menos
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
