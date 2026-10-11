// Marca imoveis "Venda Direta Online" / "Venda Online" como data continua.
// (Datas de leilao por imovel nao sao extraidas: a Caixa bloqueia scraping via Radware.)
// Ja roda automaticamente apos cada import; script mantido para uso manual. Idempotente.

import { db } from "../src/lib/db";
import { markContinuousSales } from "../src/lib/importers/enrich";

markContinuousSales()
  .then((r) => console.log(`Pendentes: ${r.pending} | marcados como continua: ${r.marked}`))
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
