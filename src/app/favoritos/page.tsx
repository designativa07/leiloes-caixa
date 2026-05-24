import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatCurrency, formatPercent, getPropertyImage } from "@/lib/format";
import { PropertyImage } from "@/components/imoveis/property-image";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata = { title: "Meus Favoritos — Leilões Caixa" };

export default async function FavoritosPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const favorites = await db.favorite.findMany({
    where: { userId: session.user.id },
    include: { auctionItem: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="page-shell">
      <div className="container">
        <section className="hero">
          <span className="badge">Minha conta</span>
          <h1>Imóveis Favoritos</h1>
          <p>
            {favorites.length === 0
              ? "Você ainda não salvou nenhum imóvel. Explore a listagem e clique no ❤️ para salvar."
              : `Você tem ${favorites.length} imóvel${favorites.length > 1 ? "is" : ""} salvo${favorites.length > 1 ? "s" : ""}.`}
          </p>
        </section>

        {favorites.length === 0 ? (
          <div className="panel" style={{ textAlign: "center", padding: "64px 40px" }}>
            <div style={{ fontSize: "3rem", marginBottom: "16px" }}>❤️</div>
            <h2 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#fff", marginBottom: "12px" }}>
              Nenhum favorito ainda
            </h2>
            <p className="muted" style={{ marginBottom: "28px" }}>
              Explore os imóveis e clique no coração para salvar os que mais te interessam.
            </p>
            <Link className="filters-submit" href="/imoveis">
              Ver imóveis disponíveis
            </Link>
          </div>
        ) : (
          <section className="panel">
            <div className="panel-header">
              <h2 className="section-title">Salvos ({favorites.length})</h2>
            </div>
            <div className="cards-grid">
              {favorites.map(({ auctionItem: item }) => {
                const imageUrl = getPropertyImage(item.externalId);
                const isDiscounted = Number(item.discountPercent) > 0;
                return (
                  <article key={item.id} className="property-card">
                    <div className="property-card-image-wrapper">
                      <PropertyImage
                        src={imageUrl}
                        alt={item.address}
                        className="property-card-image"
                        loading="lazy"
                      />
                      {isDiscounted && (
                        <span className="badge-discount-float">
                          {formatPercent(Number(item.discountPercent))} OFF
                        </span>
                      )}
                    </div>
                    <div className="property-card-content">
                      <div className="badge-row">
                        <span className="badge badge-state">{item.state}</span>
                        <span className="badge">{item.city}</span>
                      </div>
                      <h3 className="property-title" title={item.address}>{item.address}</h3>
                      <div className="price-container">
                        <div className="price-header">Preço de Venda</div>
                        <div className="price-main">{formatCurrency(Number(item.price))}</div>
                        <div className="price-appraisal">Avaliação: {formatCurrency(Number(item.appraisalValue ?? 0))}</div>
                      </div>
                      <Link className="card-link" href={`/imoveis/${item.id}`}>
                        Ver detalhes do imóvel
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
