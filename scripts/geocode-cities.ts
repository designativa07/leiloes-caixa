import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { db } from "../src/lib/db";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "leilaodb/1.0 (contato@designa.tec.br)";
const THROTTLE_MS = 1100;
const CACHE_PATH = resolve(process.cwd(), "scripts/city-coords.json");

type Coord = { lat: number; lon: number };
type Cache = Record<string, Coord | null>;

function cityKey(state: string, city: string) {
  return `${state}|${city}`;
}

async function loadCache(): Promise<Cache> {
  try {
    const raw = await readFile(CACHE_PATH, "utf8");
    return JSON.parse(raw) as Cache;
  } catch {
    return {};
  }
}

async function saveCache(cache: Cache) {
  await writeFile(CACHE_PATH, JSON.stringify(cache, null, 2), "utf8");
}

async function geocodeCity(state: string, city: string): Promise<Coord | null> {
  const q = `${city}, ${state}, Brasil`;
  const url = `${NOMINATIM_URL}?q=${encodeURIComponent(q)}&format=json&limit=1&countrycodes=br`;

  try {
    const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (!response.ok) return null;
    const data = (await response.json()) as { lat: string; lon: string }[];
    if (data.length === 0) return null;
    const lat = parseFloat(data[0].lat);
    const lon = parseFloat(data[0].lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
    return { lat, lon };
  } catch {
    return null;
  }
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const cities = await db.auctionItem.findMany({
    where: { source: "caixa", category: "imovel" },
    distinct: ["state", "city"],
    select: { state: true, city: true },
  });
  console.log(`Cidades únicas: ${cities.length}`);

  const cache = await loadCache();
  const cacheCount = Object.keys(cache).length;
  console.log(`Cache atual: ${cacheCount} cidades`);

  let geocoded = 0;
  let failed = 0;
  let fromCache = 0;
  let updated = 0;

  for (const { state, city } of cities) {
    const key = cityKey(state, city);

    let coord = cache[key];

    if (coord === undefined) {
      coord = await geocodeCity(state, city);
      cache[key] = coord;
      if (geocoded % 25 === 0) await saveCache(cache);
      if (coord) {
        geocoded++;
      } else {
        failed++;
      }
      await sleep(THROTTLE_MS);
    } else {
      fromCache++;
    }

    if (coord) {
      const result = await db.auctionItem.updateMany({
        where: { source: "caixa", category: "imovel", state, city },
        data: { latitude: coord.lat, longitude: coord.lon, geocodedAt: new Date() },
      });
      updated += result.count;
    }

    const total = geocoded + failed + fromCache;
    if (total % 25 === 0) {
      console.log(`Processadas ${total}/${cities.length} cidades (geocoded: ${geocoded}, cache: ${fromCache}, falhas: ${failed}, imóveis atualizados: ${updated})`);
    }
  }

  await saveCache(cache);

  console.log(`\nFinalizado.`);
  console.log(`Cidades: ${cities.length} (geocoded agora: ${geocoded}, do cache: ${fromCache}, falhas: ${failed})`);
  console.log(`Imóveis atualizados: ${updated}`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
