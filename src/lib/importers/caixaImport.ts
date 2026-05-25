import { db } from "@/lib/db";
import { parseCaixaCsvContent, parseCaixaCsvFile } from "@/lib/importers/caixaCsv";
import { buildAuctionItemWhere } from "@/lib/auction-items";
import { sendAlertEmail } from "@/lib/email";

export async function replaceCaixaAuctionItemsFromFile(filePath: string) {
  const parsed = await parseCaixaCsvFile(filePath);
  return replaceCaixaAuctionItems(parsed);
}

export async function replaceCaixaAuctionItemsFromContent(fileContent: string) {
  const parsed = parseCaixaCsvContent(fileContent);
  return replaceCaixaAuctionItems(parsed);
}

export async function replaceCaixaAuctionItemsFromUrl(url: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Erro ao baixar a lista da Caixa: ${response.statusText} (${response.status})`);
  }
  const arrayBuffer = await response.arrayBuffer();
  const decoder = new TextDecoder("iso-8859-1");
  const fileContent = decoder.decode(arrayBuffer);
  return replaceCaixaAuctionItemsFromContent(fileContent);
}

async function replaceCaixaAuctionItems(
  parsed: { generatedAt: Date; items: Awaited<ReturnType<typeof parseCaixaCsvFile>>["items"] },
) {
  const { generatedAt, items } = parsed;
  const importBatch = `caixa-import-${new Date().toISOString()}`;

  await db.auctionItem.deleteMany({
    where: { source: "caixa", category: "imovel" },
  });

  const chunkSize = 500;
  let totalInserted = 0;

  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    await db.auctionItem.createMany({
      data: chunk.map((item) => ({ ...item, importBatch })),
    });
    totalInserted += chunk.length;
  }

  await db.importBatch.create({
    data: {
      source: "caixa",
      generatedAt,
      itemCount: totalInserted,
    },
  });

  try {
    await sendEmailAlerts();
  } catch (err) {
    console.error("Email alerts failed (non-fatal):", err);
  }

  return { count: totalInserted, importBatch, generatedAt };
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
