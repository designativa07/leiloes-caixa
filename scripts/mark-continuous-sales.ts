// Marca todos os imoveis com modalidade "Venda Direta Online" / "Venda Online"
// como tendo data de leilao "continua" (disponivel ate vender).
//
// Nota: a extracao de data por imovel (Leilao SFI / Licitacao Aberta) NAO esta
// implementada — a Caixa bloqueia o acesso automatizado via Radware Bot Manager.
// O UI exibe "Data ainda nao disponivel. Consulte o anuncio oficial na Caixa."
// para essas modalidades e oferece o link para o anuncio.
//
// Use este script apos cada import. Idempotente e rapido (~5 segundos).

import { db } from "../src/lib/db";
import { isContinuousSaleMode } from "./auction-date-parser";

async function main() {
  const pending = await db.auctionItem.findMany({
    where: { source: "caixa", category: "imovel", scrapedAt: null },
    select: { id: true, saleMode: true },
  });

  if (pending.length === 0) {
    console.log("Nenhum imovel pendente.");
    return;
  }

  const continuousIds = pending.filter((p) => isContinuousSaleMode(p.saleMode)).map((p) => p.id);
  const now = new Date();

  if (continuousIds.length > 0) {
    await db.auctionItem.updateMany({
      where: { id: { in: continuousIds } },
      data: { auctionDateType: "continua", scrapedAt: now },
    });
  }

  console.log(`Marcados como contínua: ${continuousIds.length} imóveis.`);
  console.log(`Demais (${pending.length - continuousIds.length}) ficam com auctionDate=null — UI mostra "consulte na Caixa".`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
