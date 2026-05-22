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
  items: Awaited<ReturnType<typeof parseCaixaCsvFile>>,
) {
  const importBatch = `caixa-import-${new Date().toISOString()}`;

  // Split into chunks of 2000 to avoid exceeding the 65,535 parameter limit of PostgreSQL queries
  const chunkSize = 2000;
  const chunks: typeof items[] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }

  await db.$transaction([
    db.auctionItem.deleteMany({
      where: {
        source: "caixa",
        category: "imovel",
      },
    }),
    ...chunks.map((chunk) =>
      db.auctionItem.createMany({
        data: chunk.map((item) => ({
          ...item,
          importBatch,
        })),
      }),
    ),
  ]);

  return {
    count: items.length,
    importBatch,
  };
}
