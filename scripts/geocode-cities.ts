// Geocoda imoveis usando dataset IBGE (5570 municipios brasileiros, offline).
// Instantaneo, sem rate-limit. Idempotente: pode rodar varias vezes.

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { db } from "../src/lib/db";

const IBGE_PATH = resolve(process.cwd(), "scripts/ibge-municipios.json");

type IbgeMunicipio = {
  nome: string;
  latitude: number;
  longitude: number;
  codigo_uf: number;
};

const UF_CODE_TO_LETTER: Record<number, string> = {
  11: "RO", 12: "AC", 13: "AM", 14: "RR", 15: "PA", 16: "AP", 17: "TO",
  21: "MA", 22: "PI", 23: "CE", 24: "RN", 25: "PB", 26: "PE", 27: "AL", 28: "SE", 29: "BA",
  31: "MG", 32: "ES", 33: "RJ", 35: "SP",
  41: "PR", 42: "SC", 43: "RS",
  50: "MS", 51: "MT", 52: "GO", 53: "DF",
};

function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim();
}

async function loadIbgeIndex(): Promise<Map<string, { lat: number; lon: number }>> {
  const raw = await readFile(IBGE_PATH, "utf8");
  const cleaned = raw.replace(/^﻿/, "");
  const data = JSON.parse(cleaned) as IbgeMunicipio[];

  const index = new Map<string, { lat: number; lon: number }>();
  for (const m of data) {
    const uf = UF_CODE_TO_LETTER[m.codigo_uf];
    if (!uf) continue;
    const key = `${uf}|${normalize(m.nome)}`;
    index.set(key, { lat: m.latitude, lon: m.longitude });
  }
  return index;
}

async function main() {
  console.log("Carregando base IBGE...");
  const ibge = await loadIbgeIndex();
  console.log(`Base IBGE: ${ibge.size} municipios indexados.`);

  const cities = await db.auctionItem.findMany({
    where: { source: "caixa", category: "imovel" },
    distinct: ["state", "city"],
    select: { state: true, city: true },
  });
  console.log(`Cidades unicas nos imoveis: ${cities.length}`);

  let matched = 0;
  let notFound = 0;
  let totalUpdated = 0;
  const missing: string[] = [];

  for (const { state, city } of cities) {
    const key = `${state}|${normalize(city)}`;
    const coord = ibge.get(key);

    if (!coord) {
      notFound++;
      if (missing.length < 20) missing.push(`${state}/${city}`);
      continue;
    }

    matched++;
    const result = await db.auctionItem.updateMany({
      where: { source: "caixa", category: "imovel", state, city },
      data: { latitude: coord.lat, longitude: coord.lon, geocodedAt: new Date() },
    });
    totalUpdated += result.count;
  }

  console.log(`\nMatched: ${matched}/${cities.length} cidades (${((matched / cities.length) * 100).toFixed(1)}%)`);
  console.log(`Imoveis atualizados: ${totalUpdated}`);
  if (notFound > 0) {
    console.log(`Nao encontradas: ${notFound} (exemplos: ${missing.slice(0, 10).join(", ")})`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
