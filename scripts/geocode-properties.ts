import { db } from "../src/lib/db";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "leilaodb/1.0 (contato@designa.tec.br)";
const THROTTLE_MS = 1100;
const BATCH_SIZE = 100;

type NominatimResult = { lat: string; lon: string };

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function cleanAddress(address: string): string {
  return address
    .replace(/\bN\.\s*\d+,?/gi, "")
    .replace(/\b(QD|LT|BL|CS|Apto|Apt|VG|PAV|TORRE|VAGA)\b[^,]*,?/gi, "")
    .replace(/^R\s+/i, "Rua ")
    .replace(/^AV\s+/i, "Avenida ")
    .replace(/\s+/g, " ")
    .replace(/,\s*,/g, ",")
    .replace(/^[\s,]+|[\s,]+$/g, "")
    .trim();
}

async function geocodeQuery(q: string): Promise<{ lat: number; lon: number } | null> {
  const url = `${NOMINATIM_URL}?q=${encodeURIComponent(q)}&format=json&limit=1&countrycodes=br`;

  try {
    const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (!response.ok) {
      return null;
    }
    const data = (await response.json()) as NominatimResult[];
    if (data.length === 0) return null;
    const lat = parseFloat(data[0].lat);
    const lon = parseFloat(data[0].lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
    return { lat, lon };
  } catch {
    return null;
  }
}

async function geocodeWithFallback(address: string, district: string, city: string, state: string): Promise<{ lat: number; lon: number } | null> {
  const cleaned = cleanAddress(address);

  const queries = [
    `${cleaned}, ${district}, ${city}, ${state}, Brasil`,
    `${cleaned}, ${city}, ${state}, Brasil`,
    `${district}, ${city}, ${state}, Brasil`,
    `${city}, ${state}, Brasil`,
  ].filter((q, i, arr) => q.trim().length > 0 && arr.indexOf(q) === i);

  for (const q of queries) {
    const result = await geocodeQuery(q);
    if (result) return result;
    await sleep(THROTTLE_MS);
  }

  return null;
}

async function main() {
  let processed = 0;
  let geocoded = 0;
  let failed = 0;

  while (true) {
    const batch = await db.auctionItem.findMany({
      where: { source: "caixa", category: "imovel", geocodedAt: null },
      select: { id: true, address: true, district: true, city: true, state: true },
      take: BATCH_SIZE,
    });

    if (batch.length === 0) break;

    for (const item of batch) {
      const result = await geocodeWithFallback(item.address, item.district, item.city, item.state);
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
