import { db } from "@/lib/db";
import { parseCaixaCsvContent, parseCaixaCsvFile } from "@/lib/importers/caixaCsv";
import { buildAuctionItemWhere } from "@/lib/auction-items";
import { sendAlertEmail } from "@/lib/email";
import { geocodePendingItems, markContinuousSales } from "@/lib/importers/enrich";

// A Caixa publica em ISO-8859-1; arquivos reabertos/salvos em editor viram UTF-8.
export function decodeCaixaBuffer(buffer: ArrayBuffer | Uint8Array): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buffer).replace(/^﻿/, "");
  } catch {
    return new TextDecoder("iso-8859-1").decode(buffer);
  }
}

export async function replaceCaixaAuctionItemsFromFile(filePath: string) {
  const parsed = await parseCaixaCsvFile(filePath);
  return replaceCaixaAuctionItems(parsed);
}

export async function replaceCaixaAuctionItemsFromContent(fileContent: string) {
  const parsed = parseCaixaCsvContent(fileContent);
  return replaceCaixaAuctionItems(parsed);
}

export async function replaceCaixaAuctionItemsFromUrl(url: string) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
      "Accept": "text/csv, application/csv, text/plain, */*",
      "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
    },
  });

  if (!response.ok) {
    throw new Error(`Erro ao baixar a lista da Caixa: ${response.statusText} (${response.status})`);
  }

  const fileContent = decodeCaixaBuffer(await response.arrayBuffer());

  if (fileContent.length < 5000) {
    throw new Error(
      `Resposta inesperada da Caixa (${fileContent.length} bytes recebidos). ` +
      `CSV deveria ter ~5MB. Primeiros 300 chars: "${fileContent.slice(0, 300)}"`,
    );
  }

  if (fileContent.includes("Radware") || /captcha/i.test(fileContent)) {
    throw new Error(
      "Caixa retornou bot challenge (Radware/CAPTCHA). " +
      "IP do servidor de producao bloqueado — considere usar proxy ou rodar import via cron local.",
    );
  }

  return replaceCaixaAuctionItemsFromContent(fileContent);
}

type ParsedItem = Awaited<ReturnType<typeof parseCaixaCsvFile>>["items"][number];

const CHANGE_FIELDS = [
  "state", "city", "district", "address", "price", "appraisalValue", "discountPercent",
  "allowsFinancing", "description", "saleMode", "sourceUrl",
] as const;

function hasChanged(existing: Record<string, unknown>, item: ParsedItem) {
  return CHANGE_FIELDS.some((f) => String(existing[f] ?? "") !== String(item[f] ?? ""));
}

// Sincroniza em vez de apagar+recriar: preserva ids (favoritos), coordenadas e datas.
async function replaceCaixaAuctionItems(
  parsed: { generatedAt: Date; items: ParsedItem[] },
) {
  const { generatedAt, items } = parsed;

  if (items.length === 0) {
    throw new Error("Arquivo sem nenhum imovel — importacao cancelada para nao apagar a base.");
  }

  const importBatch = `caixa-import-${new Date().toISOString()}`;
  const where = { source: "caixa", category: "imovel" };

  const existingRows = await db.auctionItem.findMany({ where });
  const existing = new Map(existingRows.map((r) => [r.externalId, r]));
  const incomingIds = new Set(items.map((i) => i.externalId));

  const toCreate = items.filter((i) => !existing.has(i.externalId));
  const toUpdate = items.filter((i) => {
    const row = existing.get(i.externalId);
    return row && hasChanged(row, i);
  });
  const removedIds = existingRows.filter((r) => !incomingIds.has(r.externalId)).map((r) => r.id);

  const chunkSize = 500;

  for (let i = 0; i < toCreate.length; i += chunkSize) {
    await db.auctionItem.createMany({
      data: toCreate.slice(i, i + chunkSize).map((item) => ({ ...item, importBatch })),
      skipDuplicates: true,
    });
  }

  for (let i = 0; i < toUpdate.length; i += 100) {
    await db.$transaction(
      toUpdate.slice(i, i + 100).map((item) => {
        const row = existing.get(item.externalId)!;
        // Cidade/modalidade mudou: coordenadas e data continua precisam ser recalculadas.
        const reset =
          row.city !== item.city || row.state !== item.state || row.saleMode !== item.saleMode
            ? { latitude: null, longitude: null, geocodedAt: null, auctionDateType: null, scrapedAt: null }
            : {};
        return db.auctionItem.update({
          where: { id: row.id },
          data: { ...item, ...reset, importBatch },
        });
      }),
    );
  }

  // Itens inalterados: apenas carimba o lote atual.
  const touchedIds = new Set(toUpdate.map((i) => i.externalId));
  const unchangedIds = items
    .filter((i) => existing.has(i.externalId) && !touchedIds.has(i.externalId))
    .map((i) => i.externalId);
  for (let i = 0; i < unchangedIds.length; i += 5000) {
    await db.auctionItem.updateMany({
      where: { ...where, externalId: { in: unchangedIds.slice(i, i + 5000) } },
      data: { importBatch },
    });
  }

  for (let i = 0; i < removedIds.length; i += 5000) {
    await db.auctionItem.deleteMany({ where: { id: { in: removedIds.slice(i, i + 5000) } } });
  }

  await db.importBatch.create({
    data: { source: "caixa", generatedAt, itemCount: items.length },
  });

  const enrichment: { geocode?: Awaited<ReturnType<typeof geocodePendingItems>> } = {};
  try {
    enrichment.geocode = await geocodePendingItems();
    await markContinuousSales();
  } catch (err) {
    console.error("Enriquecimento (geocode/continua) falhou (non-fatal):", err);
  }

  try {
    await sendEmailAlerts();
  } catch (err) {
    console.error("Email alerts failed (non-fatal):", err);
  }

  return {
    count: items.length,
    created: toCreate.length,
    updated: toUpdate.length,
    removed: removedIds.length,
    importBatch,
    generatedAt,
    enrichment,
  };
}

async function sendEmailAlerts() {
  const savedSearches = await db.savedSearch.findMany({
    include: { user: { select: { email: true, name: true } } },
  });

  if (savedSearches.length === 0) return;

  await Promise.allSettled(
    savedSearches.map(async (search) => {
      if (!search.user.email) return;

      const filters = search.filters as Record<string, string>;
      const where = buildAuctionItemWhere(filters);

      const currentMatches = await db.auctionItem.findMany({
        where,
        select: { externalId: true },
      });
      if (currentMatches.length === 0) return;

      const seenRecords = await db.savedSearchSeen.findMany({
        where: { savedSearchId: search.id },
        select: { externalId: true },
      });
      const seenSet = new Set(seenRecords.map((r) => r.externalId));

      const newMatches = currentMatches.filter((m) => !seenSet.has(m.externalId));
      if (newMatches.length === 0) return;

      await sendAlertEmail({
        to: search.user.email,
        userName: search.user.name ?? "",
        searchName: search.name,
        matchCount: newMatches.length,
        filters,
      });

      await db.savedSearchSeen.createMany({
        data: newMatches.map((m) => ({
          savedSearchId: search.id,
          externalId: m.externalId,
        })),
        skipDuplicates: true,
      });
    }),
  );
}
