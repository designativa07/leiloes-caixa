import Link from "next/link";

import { getPropertySummary } from "@/lib/auction-items";
import { formatCurrency } from "@/lib/format";

export default async function HomePage() {
  const summary = await getPropertySummary();

  return (
    <main className="page-shell">
      <div className="container">
        <section className="hero">
          <span className="badge">MVP inicial</span>
          <h1>Visualizador de imoveis de leilao da Caixa</h1>
          <p>
            Uma base simples para consultar, filtrar e administrar futuros leiloes no mesmo
            sistema. Nesta primeira fase, trabalhamos apenas com os imoveis da Caixa em Santa
            Catarina.
          </p>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="muted">Imoveis importados</div>
              <h2>{summary.count}</h2>
            </div>

            <div className="stat-card">
              <div className="muted">Menor preco encontrado</div>
              <h2>{summary.cheapestPrice ? formatCurrency(summary.cheapestPrice) : "-"}</h2>
            </div>
          </div>

          <div className="hero-actions">
            <Link className="button" href="/imoveis">
              Ver imoveis
            </Link>
            <Link className="button-secondary" href="/admin">
              Area administrativa
            </Link>
            <a
              className="button-secondary"
              href="https://venda-imoveis.caixa.gov.br"
              target="_blank"
              rel="noreferrer"
            >
              Site oficial da Caixa
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
