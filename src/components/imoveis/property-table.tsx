import Link from "next/link";
import type { AuctionItem } from "@/generated/prisma/client";

import { formatCurrency, formatFinancing, formatPercent } from "@/lib/format";

type PropertyTableProps = {
  items: AuctionItem[];
};

export function PropertyTable({ items }: PropertyTableProps) {
  return (
    <div className="table-wrap">
      <table className="property-table">
        <thead>
          <tr>
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
