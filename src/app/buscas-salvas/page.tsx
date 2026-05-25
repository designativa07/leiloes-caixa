import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { buildPageHref } from "@/lib/format";
import { DeleteSearchButton } from "@/components/imoveis/delete-search-button";

type StoredFilters = {
  search?: string;
  state?: string;
  city?: string;
  saleMode?: string;
  financing?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
};

function filtersSummary(filters: StoredFilters): string {
  const parts: string[] = [];
  if (filters.search) parts.push(`"${filters.search}"`);
  if (filters.state) parts.push(filters.state);
  if (filters.city) parts.push(`Cidades: ${filters.city.split(",").length}`);
  if (filters.saleMode) parts.push(filters.saleMode);
  if (filters.financing === "sim") parts.push("Aceita financiamento");
  if (filters.financing === "nao") parts.push("Sem financiamento");
  if (filters.minPrice) parts.push(`≥ R$ ${filters.minPrice}`);
  if (filters.maxPrice) parts.push(`≤ R$ ${filters.maxPrice}`);
  return parts.length > 0 ? parts.join(" · ") : "Todos os imóveis";
}

export default async function SavedSearchesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const searches = await db.savedSearch.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { seenProperties: true } },
    },
  });

  return (
    <main className="page-shell">
      <div className="container">
        <section className="hero">
          <span className="badge">Alertas por Email</span>
          <h1>Minhas Buscas Salvas</h1>
          <p>
            Buscas salvas geram alertas por email sempre que aparecerem imóveis novos que correspondam aos filtros.
          </p>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <h2 className="section-title">Suas buscas ({searches.length})</h2>
              <div className="muted">Você receberá emails apenas quando aparecerem imóveis novos — não recebe duplicatas.</div>
            </div>
          </div>

          {searches.length === 0 ? (
            <div style={{
              padding: "40px 24px",
              textAlign: "center",
              background: "rgba(255,255,255,0.02)",
              border: "1px dashed rgba(255,255,255,0.08)",
              borderRadius: "16px",
            }}>
              <div className="muted" style={{ fontSize: "0.95rem", marginBottom: 16 }}>
                Você ainda não tem buscas salvas.
              </div>
              <Link
                href="/imoveis"
                style={{
                  display: "inline-block",
                  background: "rgba(37,99,235,0.5)",
                  color: "#fff",
                  padding: "10px 20px",
                  borderRadius: "12px",
                  textDecoration: "none",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                }}
              >
                Aplicar filtros e salvar busca →
              </Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {searches.map((s) => {
                const f = s.filters as StoredFilters;
                const viewHref = buildPageHref("/imoveis", {
                  search: f.search,
                  state: f.state,
                  city: f.city,
                  saleMode: f.saleMode,
                  financing: f.financing,
                  minPrice: f.minPrice,
                  maxPrice: f.maxPrice,
                  sort: f.sort,
                });

                return (
                  <div
                    key={s.id}
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.07)",
                      borderRadius: "16px",
                      padding: "18px 20px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 16,
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{ flex: "1 1 240px", minWidth: 0 }}>
                      <div style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: 4 }}>{s.name}</div>
                      <div className="muted" style={{ fontSize: "0.82rem", marginBottom: 4 }}>
                        {filtersSummary(f)}
                      </div>
                      <div className="muted" style={{ fontSize: "0.72rem" }}>
                        Criada em {new Date(s.createdAt).toLocaleDateString("pt-BR")} · {s._count.seenProperties} imóveis já notificados
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                      <Link
                        href={viewHref}
                        style={{
                          background: "rgba(37,99,235,0.15)",
                          border: "1px solid rgba(37,99,235,0.3)",
                          color: "#60a5fa",
                          padding: "8px 14px",
                          borderRadius: "10px",
                          textDecoration: "none",
                          fontSize: "0.85rem",
                          fontWeight: 600,
                        }}
                      >
                        Ver resultados
                      </Link>
                      <DeleteSearchButton id={s.id} name={s.name} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
