import { resolve } from "node:path";

import { db } from "../src/lib/db";
import {
  replaceCaixaAuctionItemsFromFile,
  replaceCaixaAuctionItemsFromUrl,
} from "../src/lib/importers/caixaImport";

async function main() {
  const args = process.argv.slice(2);
  const isOnline = args.includes("--online");

  if (isOnline) {
    const url = "https://venda-imoveis.caixa.gov.br/listaweb/Lista_imoveis_geral.csv";
    console.log("Baixando e importando lista da Caixa online...");
    const result = await replaceCaixaAuctionItemsFromUrl(url);
    console.log(`Importacao online concluida com ${result.count} imoveis. Lote: ${result.importBatch}`);
  } else {
    const csvPath = resolve(process.cwd(), "Lista_imoveis_geral.csv");
    console.log(`Importando arquivo local: ${csvPath}...`);
    const result = await replaceCaixaAuctionItemsFromFile(csvPath);
    console.log(`Importacao local concluida com ${result.count} imoveis. Lote: ${result.importBatch}`);
  }
}

main()
  .catch((error) => {
    console.error("Falha ao importar CSV da Caixa.");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
