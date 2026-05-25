import { db } from "../src/lib/db";

async function main() {
  const geocodeReset = await db.auctionItem.updateMany({
    where: {
      source: "caixa",
      category: "imovel",
      geocodedAt: { not: null },
      latitude: null,
    },
    data: { geocodedAt: null },
  });
  console.log(`Reset geocodedAt para ${geocodeReset.count} items (que falharam no geocoding).`);

  const scrapeReset = await db.auctionItem.updateMany({
    where: {
      source: "caixa",
      category: "imovel",
      scrapedAt: { not: null },
      auctionDateType: null,
    },
    data: { scrapedAt: null },
  });
  console.log(`Reset scrapedAt para ${scrapeReset.count} items (que falharam no scraping).`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
