import { db } from "../src/lib/db";

async function main() {
  const states = ["SC", "SP", "RJ", "MG", "RS", "PR"];
  for (const state of states) {
    const total = await db.auctionItem.count({ where: { state } });
    const withCoords = await db.auctionItem.count({ where: { state, latitude: { not: null } } });
    console.log(`${state}: ${withCoords}/${total} (${total ? ((withCoords / total) * 100).toFixed(1) : 0}%)`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
