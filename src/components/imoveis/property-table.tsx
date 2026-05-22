import Link from "next/link";
import type { AuctionItem } from "@/generated/prisma/client";

import { formatCurrency, formatFinancing, formatPercent, getPropertyImage } from "@/lib/format";
import { PropertyImage } from "@/components/imoveis/property-image";

type PropertyTableProps = {
  items: AuctionItem[];
};

export function PropertyTable({ items }: PropertyTableProps) {
  return (
    <div className="table-wrap">
      <table className="property-table">
        <thead>
          <tr>
            <th style={{ width: "140px" }}>Foto</th>
            <th>Imovel</th>
            <th>Cidade</th>
            <th>Preco</th>
            <th>Desconto</th>
            <th>Financia</th>
            <th>Modalidade</th>
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
