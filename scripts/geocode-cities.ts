// Geocoda imoveis sem coordenadas usando dataset IBGE (offline). Idempotente.

import { db } from "../src/lib/db";
import { geocodePendingItems } from "../src/lib/importers/enrich";

geocodePendingItems()
  .then((r) => console.log(`Cidades pendentes: ${r.cities} | nao encontradas: ${r.notFound} | imoveis atualizados: ${r.updated}`))
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
