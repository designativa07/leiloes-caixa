import Link from "next/link";
import type { AuctionItem } from "@/generated/prisma/client";

import { formatAuctionDate, formatCurrency, formatFinancing, formatPercent, getPropertyImage } from "@/lib/format";
import { PropertyImage } from "@/components/imoveis/property-image";

type PropertyCardProps = {
  item: AuctionItem;
};

export function PropertyCard({ item }: PropertyCardProps) {
  const imageUrl = getPropertyImage(item.externalId);
  const isDiscounted = Number(item.discountPercent) > 0;

  return (
    <article className="property-card">
      <div className="property-card-image-wrapper">
        <PropertyImage
          src={imageUrl}
          alt={item.address}
          className="property-card-image"
          loading="lazy"
        />
        {isDiscounted ? (
          <span className="badge-discount-float">
            {formatPercent(Number(item.discountPercent))} OFF
          </span>
        ) : null}
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

        <div className="property-meta">
          <div>
            <span className="muted font-small">Cód:</span> <span className="font-small">{item.externalId}</span>
          </div>
          <div>
            <span className="muted font-small">Modalidade:</span> <span className="font-small">{item.saleMode}</span>
          </div>
          {(() => {
            const auction = formatAuctionDate(item.auctionDate, item.auctionDateType);
            if (auction.kind === "none") return null;
            return (
              <div>
                <span className="muted font-small">Leilão:</span>{" "}
                <span className="font-small">
                  {auction.primary}
                  {auction.secondary && ` (${auction.secondary})`}
                </span>
              </div>
            );
          })()}
        </div>

        <Link className="card-link" href={`/imoveis/${item.id}`}>
          Ver detalhes do imóvel
        </Link>
      </div>
    </article>
  );
}
