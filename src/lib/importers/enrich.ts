// Enriquecimento pos-import: geocoding offline (IBGE) e marcacao de venda continua.
// Idempotente — usado pelo import (caixaImport) e pelos scripts `geocode` / `mark:continuous`.

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { db } from "@/lib/db";

const IBGE_PATH = resolve(process.cwd(), "scripts/ibge-municipios.json");

type IbgeMunicipio = { nome: string; latitude: number; longitude: number; codigo_uf: number };

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

export function isContinuousSaleMode(saleMode: string): boolean {
  const m = saleMode.toLowerCase();
  return m.startsWith("venda direta") || m === "venda online";
}

async function loadIbgeIndex() {
  const raw = (await readFile(IBGE_PATH, "utf8")).replace(/^﻿/, "");
  const data = JSON.parse(raw) as IbgeMunicipio[];
  const index = new Map<string, { lat: number; lon: number }>();
  for (const m of data) {
    const uf = UF_CODE_TO_LETTER[m.codigo_uf];
    if (uf) index.set(`${uf}|${normalize(m.nome)}`, { lat: m.latitude, lon: m.longitude });
  }
  return index;
}

/** Preenche latitude/longitude dos imoveis ainda sem coordenadas. */
export async function geocodePendingItems() {
  const ibge = await loadIbgeIndex();
  const cities = await db.auctionItem.findMany({
    where: { source: "caixa", category: "imovel", latitude: null },
    distinct: ["state", "city"],
    select: { state: true, city: true },
  });

  let updated = 0;
  let notFound = 0;
  for (const { state, city } of cities) {
    const coord = ibge.get(`${state}|${normalize(city)}`);
    if (!coord) {
      notFound++;
      continue;
    }
    const result = await db.auctionItem.updateMany({
      where: { source: "caixa", category: "imovel", state, city, latitude: null },
      data: { latitude: coord.lat, longitude: coord.lon, geocodedAt: new Date() },
    });
    updated += result.count;
  }
  return { cities: cities.length, notFound, updated };
}

/** Marca "Venda Direta/Online" como data continua nos imoveis ainda nao processados. */
export async function markContinuousSales() {
  const pending = await db.auctionItem.findMany({
    where: { source: "caixa", category: "imovel", scrapedAt: null },
    select: { id: true, saleMode: true },
  });
  const ids = pending.filter((p) => isContinuousSaleMode(p.saleMode)).map((p) => p.id);

  const chunkSize = 5000;
  for (let i = 0; i < ids.length; i += chunkSize) {
    await db.auctionItem.updateMany({
      where: { id: { in: ids.slice(i, i + chunkSize) } },
      data: { auctionDateType: "continua", scrapedAt: new Date() },
    });
  }
  return { pending: pending.length, marked: ids.length };
}
