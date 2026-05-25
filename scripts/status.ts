import { db } from "../src/lib/db";

async function main() {
  const total = await db.auctionItem.count();
  const withCoords = await db.auctionItem.count({ where: { latitude: { not: null } } });
  const continua = await db.auctionItem.count({ where: { auctionDateType: "continua" } });
  const withDate = await db.auctionItem.count({ where: { auctionDate: { not: null } } });

  const savedSearches = await db.savedSearch.count();
  const seen = await db.savedSearchSeen.count();
  const lastImport = await db.importBatch.findFirst({ orderBy: { createdAt: "desc" } });

  console.log("==== Status do sistema ====\n");
  console.log(`Imóveis totais:        ${total.toLocaleString("pt-BR")}`);
  console.log(`  no mapa (lat/lng):   ${withCoords.toLocaleString("pt-BR")} (${((withCoords / total) * 100).toFixed(1)}%)`);
  console.log(`  marcados contínua:   ${continua.toLocaleString("pt-BR")} (${((continua / total) * 100).toFixed(1)}%)`);
  console.log(`  com data de leilão:  ${withDate.toLocaleString("pt-BR")} (não implementado, Caixa bloqueia)`);
  console.log("");
  console.log(`Buscas salvas:         ${savedSearches}`);
  console.log(`  marcações 'seen':    ${seen}`);
  console.log("");
  if (lastImport) {
    console.log(`Último import batch:   ${lastImport.generatedAt.toISOString().slice(0, 10)} (${lastImport.itemCount} items)`);
  } else {
    console.log("Nenhum ImportBatch registrado.");
  }
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
