import { db } from "../src/lib/db";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "leilaodb/1.0 (contato@designa.tec.br)";
const THROTTLE_MS = 1100;
const BATCH_SIZE = 100;

type NominatimResult = { lat: string; lon: string };

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function geocode(address: string, city: string, state: string): Promise<{ lat: number; lon: number } | null> {
  const q = `${address}, ${city}, ${state}, Brasil`;
  const url = `${NOMINATIM_URL}?q=${encodeURIComponent(q)}&format=json&limit=1&countrycodes=br`;

  try {
    const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (!response.ok) {
      console.warn(`HTTP ${response.status} para "${q}"`);
      return null;
    }
    const data = (await response.json()) as NominatimResult[];
    if (data.length === 0) return null;
    return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
  } catch (err) {
    console.warn(`Falha geocodando "${q}":`, (err as Error).message);
    return null;
  }
}

async function main() {
  let processed = 0;
  let geocoded = 0;
  let failed = 0;

  while (true) {
    const batch = await db.auctionItem.findMany({
      where: { source: "caixa", category: "imovel", geocodedAt: null },
      select: { id: true, address: true, city: true, state: true },
      take: BATCH_SIZE,
    });

    if (batch.length === 0) break;

    for (const item of batch) {
      const result = await geocode(item.address, item.city, item.state);
      const now = new Date();

      if (result) {
        await db.auctionItem.update({
          where: { id: item.id },
          data: { latitude: result.lat, longitude: result.lon, geocodedAt: now },
        });
        geocoded++;
      } else {
        await db.auctionItem.update({
          where: { id: item.id },
          data: { geocodedAt: now },
        });
        failed++;
      }

      processed++;
      if (processed % 50 === 0) {
        console.log(`Processados: ${processed} (geocodados: ${geocoded}, falhas: ${failed})`);
      }

      await sleep(THROTTLE_MS);
    }
  }

  console.log(`\nFinalizado. Total: ${processed}, geocodados: ${geocoded}, falhas: ${failed}.`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
