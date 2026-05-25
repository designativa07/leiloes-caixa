import { db } from "../src/lib/db";

async function main() {
  const total = await db.auctionItem.count();
  const g = await db.auctionItem.count({ where: { geocodedAt: { not: null } } });
  const ll = await db.auctionItem.count({ where: { latitude: { not: null } } });
  const s = await db.auctionItem.count({ where: { scrapedAt: { not: null } } });
  const c = await db.auctionItem.count({ where: { auctionDateType: "continua" } });
  const d = await db.auctionItem.count({ where: { auctionDate: { not: null } } });
  console.log("Total imoveis:", total);
  console.log("Geocoded (geocodedAt set):", g, `(${((g/total)*100).toFixed(1)}%)`);
  console.log("  with lat/lng:", ll);
  console.log("Scraped (scrapedAt set):", s, `(${((s/total)*100).toFixed(1)}%)`);
  console.log("  marked continua:", c);
  console.log("  with auctionDate:", d);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
