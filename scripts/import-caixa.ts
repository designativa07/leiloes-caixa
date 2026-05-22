import { resolve } from "node:path";

import { db } from "../src/lib/db";
import { replaceCaixaAuctionItemsFromFile } from "../src/lib/importers/caixaImport";

async function main() {
  const csvPath = resolve(process.cwd(), "Lista_imoveisSC.csv");
  const result = await replaceCaixaAuctionItemsFromFile(csvPath);
  console.log(`Importacao concluida com ${result.count} imoveis.`);
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
