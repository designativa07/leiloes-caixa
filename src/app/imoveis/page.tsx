import Link from "next/link";

import { PropertyCard } from "@/components/imoveis/property-card";
import { PropertyFilters } from "@/components/imoveis/filters";
import { PropertyTable } from "@/components/imoveis/property-table";
import { getPropertyFilterOptions, getPropertyList, getPropertySummary, normalizeFilters } from "@/lib/auction-items";
import { buildPageHref, formatCurrency } from "@/lib/format";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function getSingleValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const resolvedSearchParams = await searchParams;

  const filters = {
    search: getSingleValue(resolvedSearchParams.search),
    state: getSingleValue(resolvedSearchParams.state),
    city: getSingleValue(resolvedSearchParams.city),
    saleMode: getSingleValue(resolvedSearchParams.saleMode),
    financing: getSingleValue(resolvedSearchParams.financing),
    minPrice: getSingleValue(resolvedSearchParams.minPrice),
    maxPrice: getSingleValue(resolvedSearchParams.maxPrice),
    sort: getSingleValue(resolvedSearchParams.sort),
    page: getSingleValue(resolvedSearchParams.page),
  };

  const [options, result, summary] = await Promise.all([
    getPropertyFilterOptions(),
    getPropertyList(filters),
    getPropertySummary(),
  ]);

  const normalizedFilters = normalizeFilters(filters);

  return (
    <main className="page-shell">
      <div className="container">
        <section className="hero">
          <span className="badge">Caixa Econômica Federal</span>
          <h1>Painel de Oportunidades Caixa</h1>
          <p>
            Consulte milhares de imóveis de leilão em todo o Brasil com busca rápida, filtros essenciais e fotos reais do local direto do servidor da Caixa.
          </p>
          
          <div className="stats-grid" style={{ marginTop: 24, marginBottom: 8 }}>
            <div className="stat-card" style={{ background: "rgba(255, 255, 255, 0.06)", border: "1px solid rgba(255, 255, 255, 0.1)" }}>
              <div className="muted" style={{ color: "rgba(255, 255, 255, 0.7)" }}>Total de Imóveis</div>
              <h2 style={{ margin: "8px 0 0", fontSize: "1.8rem" }}>{summary.count.toLocaleString("pt-BR")}</h2>
            </div>

            <div className="stat-card" style={{ background: "rgba(255, 255, 255, 0.06)", border: "1px solid rgba(255, 255, 255, 0.1)" }}>
              <div className="muted" style={{ color: "rgba(255, 255, 255, 0.7)" }}>A partir de</div>
              <h2 style={{ margin: "8px 0 0", fontSize: "1.8rem" }}>
                {summary.cheapestPrice ? formatCurrency(summary.cheapestPrice) : "-"}
              </h2>
            </div>
          </div>
        </section>

        <PropertyFilters
          states={options.states}
          cities={options.cities}
          filters={normalizedFilters}
          saleModes={options.saleModes}
        />

        <section className="panel">
          <div className="panel-header">
            <div>
              <h2 className="section-title">Resultados</h2>
              <div className="muted">
                {result.total} imoveis encontrados. Pagina {result.page} de {result.totalPages}.
              </div>
            </div>
          </div>

          {result.items.length === 0 ? (
            <div className="muted">Nenhum imovel encontrado com os filtros atuais.</div>
          ) : (
            <>
              <div className="mobile-only">
                <div className="cards-grid">
                  {result.items.map((item) => (
                    <PropertyCard key={item.id} item={item} />
                  ))}
                </div>
              </div>

              <div className="desktop-only">
                <PropertyTable items={result.items} />
              </div>

              <nav className="pagination" aria-label="Paginacao">
                {Array.from({ length: result.totalPages }, (_, index) => {
                  const pageNumber = index + 1;
                  const href = buildPageHref("/imoveis", {
                    search: normalizedFilters.search || undefined,
                    state: normalizedFilters.state || undefined,
                    city: normalizedFilters.city || undefined,
                    saleMode: normalizedFilters.saleMode || undefined,
                    financing: normalizedFilters.financing || undefined,
                    minPrice: normalizedFilters.minPrice || undefined,
                    maxPrice: normalizedFilters.maxPrice || undefined,
                    sort: normalizedFilters.sort || undefined,
                    page: String(pageNumber),
                  });

                  return (
                    <Link
                      key={pageNumber}
                      className={`pagination-link ${pageNumber === result.page ? "active" : ""}`.trim()}
                      href={href}
                    >
                      {pageNumber}
                    </Link>
                  );
                })}
              </nav>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
