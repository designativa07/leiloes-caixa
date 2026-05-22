import Link from "next/link";
import type { AuctionItem } from "@/generated/prisma/client";

import { formatCurrency, formatFinancing, formatPercent } from "@/lib/format";

type PropertyCardProps = {
  item: AuctionItem;
};

export function PropertyCard({ item }: PropertyCardProps) {
  return (
    <article className="property-card">
      <div className="badge-row">
        <span className="badge">{item.city}</span>
        <span className="badge">{item.district}</span>
        {Number(item.discountPercent) > 0 ? (
          <span className="badge badge-highlight">{formatPercent(Number(item.discountPercent))}</span>
        ) : null}
      </div>

      <div className="price-row">
        <div>
          <p className="muted">Preco</p>
          <h3 className="price-main">{formatCurrency(Number(item.price))}</h3>
          <p className="price-secondary">Avaliacao: {formatCurrency(Number(item.appraisalValue ?? 0))}</p>
        </div>
      </div>

      <div>
        <h3 className="property-title">{item.address}</h3>
        <p className="muted">
          {item.city} - {item.state}
        </p>
      </div>

      <div className="property-meta">
        <span>Numero do imovel: {item.externalId}</span>
        <span>Modalidade: {item.saleMode}</span>
        <span>Financiamento: {formatFinancing(item.allowsFinancing)}</span>
      </div>

      <Link className="card-link" href={`/imoveis/${item.id}`}>
        Ver detalhes
      </Link>
    </article>
  );
}
