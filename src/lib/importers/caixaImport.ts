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

  // Step 1: delete existing items (no transaction needed)
  await db.auctionItem.deleteMany({
    where: {
      source: "caixa",
      category: "imovel",
    },
  });

  // Step 2: insert in chunks of 500 to avoid parameter limit and timeouts
  const chunkSize = 500;
  let totalInserted = 0;

  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    await db.auctionItem.createMany({
      data: chunk.map((item) => ({
        ...item,
        importBatch,
      })),
    });
    totalInserted += chunk.length;
  }

  return {
    count: totalInserted,
    importBatch,
  };
}
