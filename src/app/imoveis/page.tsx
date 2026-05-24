import Link from "next/link";

import { PropertyCard } from "@/components/imoveis/property-card";
import { PropertyFilters } from "@/components/imoveis/filters";
import { PropertyTable } from "@/components/imoveis/property-table";
import { getLatestImportBatch, getPropertyFilterOptions, getPropertyList, getPropertySummary, hasActiveFilters, normalizeFilters } from "@/lib/auction-items";
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

  const [options, result, summary, latestBatch] = await Promise.all([
    getPropertyFilterOptions(),
    getPropertyList(filters),
    getPropertySummary(filters),
    getLatestImportBatch(),
  ]);

  const normalizedFilters = normalizeFilters(filters);
  const filtersActive = hasActiveFilters(filters);
  const totalLabel = filtersActive ? "Resultados encontrados" : "Total de Imóveis";
  const cheapestLabel = filtersActive ? "Menor preço (filtros)" : "A partir de";

  // Smart pagination logic
  const currentPage = result.page;
  const totalPages = result.totalPages;
  const delta = 2; // Show 2 pages before and after current
  const range: number[] = [];
  for (
    let i = Math.max(2, currentPage - delta);
    i <= Math.min(totalPages - 1, currentPage + delta);
    i++
  ) {
    range.push(i);
  }

  const pagesToShow: (number | "ellipsis")[] = [];
  pagesToShow.push(1);

  if (currentPage - delta > 2) {
    pagesToShow.push("ellipsis");
  }

  pagesToShow.push(...range);

  if (currentPage + delta < totalPages - 1) {
    pagesToShow.push("ellipsis");
  }

  if (totalPages > 1) {
    pagesToShow.push(totalPages);
  }

  const buildPageLink = (pageNumber: number) => {
    return buildPageHref("/imoveis", {
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
  };

  return (
    <main className="page-shell">
      <div className="container">
        <section className="hero">
          <span className="badge">Caixa Econômica Federal</span>
          {latestBatch && (
            <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", marginTop: 8 }}>
              Listagem atualizada em {new Date(latestBatch.generatedAt).toLocaleDateString("pt-BR")}
            </div>
          )}
          <h1>Painel de Oportunidades Caixa</h1>
          <p>
            Consulte milhares de imóveis de leilão em todo o Brasil com busca rápida, filtros essenciais e fotos reais do local direto do servidor da Caixa.
          </p>
          
          <div className="stats-grid" style={{ marginTop: 24, marginBottom: 8 }}>
            <div className="stat-card" style={{ background: "rgba(255, 255, 255, 0.06)", border: "1px solid rgba(255, 255, 255, 0.1)" }}>
              <div className="muted" style={{ color: "rgba(255, 255, 255, 0.7)" }}>{totalLabel}</div>
              <h2 style={{ margin: "8px 0 0", fontSize: "1.8rem" }}>{summary.count.toLocaleString("pt-BR")}</h2>
            </div>

            <div className="stat-card" style={{ background: "rgba(255, 255, 255, 0.06)", border: "1px solid rgba(255, 255, 255, 0.1)" }}>
              <div className="muted" style={{ color: "rgba(255, 255, 255, 0.7)" }}>{cheapestLabel}</div>
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
                <PropertyTable items={result.items} filters={normalizedFilters} />
              </div>

              <nav className="pagination" aria-label="Paginacao" style={{ marginTop: 32, gap: 6 }}>
                {currentPage > 1 && (
                  <Link
                    className="pagination-link"
                    href={buildPageLink(currentPage - 1)}
                    title="Página Anterior"
                    style={{ padding: "0 14px", minWidth: "auto" }}
                  >
                    &larr; Ant
                  </Link>
                )}

                {pagesToShow.map((page, idx) => {
                  if (page === "ellipsis") {
                    return (
                      <span
                        key={`ellipsis-${idx}`}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: "40px",
                          height: "40px",
                          color: "var(--text-muted)",
                          fontWeight: 600,
                        }}
                      >
                        ...
                      </span>
                    );
                  }

                  return (
                    <Link
                      key={page}
                      className={`pagination-link ${page === currentPage ? "active" : ""}`.trim()}
                      href={buildPageLink(page)}
                    >
                      {page}
                    </Link>
                  );
                })}

                {currentPage < totalPages && (
                  <Link
                    className="pagination-link"
                    href={buildPageLink(currentPage + 1)}
                    title="Próxima Página"
                    style={{ padding: "0 14px", minWidth: "auto" }}
                  >
                    Próx &rarr;
                  </Link>
                )}
              </nav>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
