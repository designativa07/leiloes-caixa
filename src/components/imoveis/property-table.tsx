import Link from "next/link";
import type { AuctionItem } from "@/generated/prisma/client";

import { buildPageHref, formatAuctionDate, formatCurrency, formatFinancing, formatPercent, getPropertyImage } from "@/lib/format";
import { PropertyImage } from "@/components/imoveis/property-image";

type PropertyTableProps = {
  items: AuctionItem[];
  filters: any;
};

export function PropertyTable({ items, filters }: PropertyTableProps) {
  const currentSort = filters.sort || "discount_desc";

  const getSortHref = (targetSort: string) => {
    return buildPageHref("/imoveis", {
      ...filters,
      sort: targetSort,
      page: "1", // Reset to page 1 on sort change
    });
  };

  const priceSort = currentSort === "price_asc" ? "price_desc" : "price_asc";
  const priceArrow = currentSort === "price_asc" ? " ▲" : currentSort === "price_desc" ? " ▼" : "";

  const discountSort = currentSort === "discount_desc" ? "discount_asc" : "discount_desc";
  const discountArrow = currentSort === "discount_desc" ? " ▼" : currentSort === "discount_asc" ? " ▲" : "";

  return (
    <div className="table-wrap">
      <table className="property-table">
        <thead>
          <tr>
            <th style={{ width: "140px" }}>Foto</th>
            <th>Imovel</th>
            <th>Cidade</th>
            <th>
              <Link
                href={getSortHref(priceSort)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  color: "inherit",
                  textDecoration: "none",
                  gap: "4px",
                }}
              >
                Preço{priceArrow}
              </Link>
            </th>
            <th>
              <Link
                href={getSortHref(discountSort)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  color: "inherit",
                  textDecoration: "none",
                  gap: "4px",
                }}
              >
                Desconto{discountArrow}
              </Link>
            </th>
            <th>Financia</th>
            <th>Modalidade</th>
            <th>Data</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>
                <Link href={`/imoveis/${item.id}`}>
                  <div style={{ width: "120px", height: "90px", overflow: "hidden", borderRadius: "12px", background: "rgba(255, 255, 255, 0.05)", position: "relative", boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }}>
                    <PropertyImage
                      src={getPropertyImage(item.externalId)}
                      alt={item.address}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      height="90px"
                    />
                  </div>
                </Link>
              </td>
              <td>
                <strong>{item.address}</strong>
                <div className="muted">{item.externalId}</div>
              </td>
              <td>
                {item.city}
                <div className="muted">{item.district}</div>
              </td>
              <td>
                <strong>{formatCurrency(Number(item.price))}</strong>
                <div className="muted">Aval.: {formatCurrency(Number(item.appraisalValue ?? 0))}</div>
              </td>
              <td>{formatPercent(Number(item.discountPercent ?? 0))}</td>
              <td>{formatFinancing(item.allowsFinancing)}</td>
              <td>{item.saleMode}</td>
              <td>
                {(() => {
                  const auction = formatAuctionDate(item.auctionDate, item.auctionDateType);
                  if (auction.kind === "continua") {
                    return (
                      <span style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e", padding: "3px 10px", borderRadius: "8px", fontSize: "0.75rem", fontWeight: 700 }}>
                        Contínua
                      </span>
                    );
                  }
                  return (
                    <>
                      <strong style={{ fontSize: "0.9rem" }}>{auction.primary}</strong>
                      {auction.secondary && <div className="muted" style={{ fontSize: "0.75rem" }}>{auction.secondary}</div>}
                    </>
                  );
                })()}
              </td>
              <td>
                <Link className="filters-clear" href={`/imoveis/${item.id}`}>
                  Detalhes
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
