import Link from "next/link";
import { notFound } from "next/navigation";

import { db } from "@/lib/db";
import { formatCurrency, formatFinancing, formatPercent } from "@/lib/format";

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

  return (
    <main className="page-shell">
      <div className="container">
        <Link className="back-link" href="/imoveis">
          Voltar para a listagem
        </Link>

        <div className="detail-grid">
          <section className="detail-card">
            <div className="detail-badges">
              <span className="badge">{item.city}</span>
              <span className="badge">{item.district}</span>
              <span className="badge">{item.saleMode}</span>
              {Number(item.discountPercent) > 0 ? (
                <span className="badge badge-highlight">
                  Desconto de {formatPercent(Number(item.discountPercent))}
                </span>
              ) : null}
            </div>

            <h1 className="detail-title">{item.address}</h1>
            <p className="muted">
              {item.city} - {item.state}
            </p>

            <div className="detail-list">
              <div>
                <strong>Numero do imovel:</strong> {item.externalId}
              </div>
              <div>
                <strong>Preco:</strong> {formatCurrency(Number(item.price))}
              </div>
              <div>
                <strong>Valor de avaliacao:</strong> {formatCurrency(Number(item.appraisalValue ?? 0))}
              </div>
              <div>
                <strong>Financiamento:</strong> {formatFinancing(item.allowsFinancing)}
              </div>
            </div>

            <div className="panel" style={{ marginTop: 24 }}>
              <h2 className="section-title">Descricao</h2>
              <div className="detail-description">{item.description}</div>
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
