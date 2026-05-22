import { db } from "@/lib/db";
import { parseCaixaCsvContent, parseCaixaCsvFile } from "@/lib/importers/caixaCsv";

export async function replaceCaixaAuctionItemsFromFile(filePath: string) {
  const items = await parseCaixaCsvFile(filePath);
  return replaceCaixaAuctionItems(items);
}

export async function replaceCaixaAuctionItemsFromContent(fileContent: string) {
  const items = parseCaixaCsvContent(fileContent);
  return replaceCaixaAuctionItems(items);
}

async function replaceCaixaAuctionItems(
  items: Awaited<ReturnType<typeof parseCaixaCsvFile>>,
) {
  const importBatch = `caixa-sc-${new Date().toISOString()}`;

  await db.$transaction([
    db.auctionItem.deleteMany({
      where: {
        source: "caixa",
        category: "imovel",
      },
    }),
    db.auctionItem.createMany({
      data: items.map((item) => ({
        ...item,
        importBatch,
      })),
    }),
  ]);

  return {
    count: items.length,
    importBatch,
  };
}
