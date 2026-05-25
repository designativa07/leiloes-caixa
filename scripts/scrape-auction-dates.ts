import { db } from "../src/lib/db";
import { extractAuctionInfo, isContinuousSaleMode } from "./auction-date-parser";

const THROTTLE_MS = 500;
const BATCH_SIZE = 100;
const USER_AGENT = "leilaodb/1.0 (contato@designa.tec.br)";

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchWithRetry(url: string, retries = 3): Promise<string | null> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
      if (response.ok) return await response.text();
      if (response.status === 429 || response.status === 503) {
        await sleep(2000 * Math.pow(2, i));
        continue;
      }
      return null;
    } catch {
      if (i === retries - 1) return null;
      await sleep(2000 * Math.pow(2, i));
    }
  }
  return null;
}

async function main() {
  let processed = 0;
  let scraped = 0;
  let marked_continuous = 0;
  let failed = 0;

  while (true) {
    const batch = await db.auctionItem.findMany({
      where: { source: "caixa", category: "imovel", scrapedAt: null },
      select: { id: true, sourceUrl: true, saleMode: true },
      take: BATCH_SIZE,
    });

    if (batch.length === 0) break;

    for (const item of batch) {
      const now = new Date();

      if (isContinuousSaleMode(item.saleMode)) {
        await db.auctionItem.update({
          where: { id: item.id },
          data: { auctionDateType: "continua", scrapedAt: now },
        });
        marked_continuous++;
        processed++;
        continue;
      }

      const html = await fetchWithRetry(item.sourceUrl);
      if (!html) {
        await db.auctionItem.update({
          where: { id: item.id },
          data: { scrapedAt: now },
        });
        failed++;
      } else {
        const info = extractAuctionInfo(html);
        await db.auctionItem.update({
          where: { id: item.id },
          data: {
            auctionDate: info.date,
            auctionDateType: info.type,
            scrapedAt: now,
          },
        });
        if (info.date) scraped++;
        else failed++;
      }

      processed++;
      if (processed % 50 === 0) {
        console.log(`Processados: ${processed} (scraped: ${scraped}, contínuos: ${marked_continuous}, falhas: ${failed})`);
      }

      await sleep(THROTTLE_MS);
    }
  }

  console.log(`\nFinalizado. Total: ${processed}, scraped: ${scraped}, contínuos: ${marked_continuous}, falhas: ${failed}.`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
