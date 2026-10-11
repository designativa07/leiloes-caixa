// Envia a lista da Caixa para o sistema em producao (POST /api/admin/import-caixa).
// Sem argumento tenta baixar da Caixa (o Radware costuma bloquear fetch do Node);
// o caminho confiavel e baixar o arquivo no navegador e passar o caminho dele.
//
//   npx tsx scripts/push-caixa.ts [caminho/Lista_imoveis_geral.csv]
//
// Variaveis (arquivo .env local ou ambiente):
//   IMPORT_URL    ex: https://seu-dominio.com/api/admin/import-caixa
//   IMPORT_TOKEN  mesmo valor configurado no servidor

import "dotenv/config";
import { readFile } from "node:fs/promises";

const CAIXA_URL = "https://venda-imoveis.caixa.gov.br/listaweb/Lista_imoveis_geral.csv";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";

async function main() {
  const { IMPORT_URL, IMPORT_TOKEN } = process.env;
  if (!IMPORT_URL || !IMPORT_TOKEN) throw new Error("Defina IMPORT_URL e IMPORT_TOKEN.");

  let data: Buffer;
  const localFile = process.argv[2];
  if (localFile) {
    data = await readFile(localFile);
  } else {
    const res = await fetch(CAIXA_URL, { headers: { "User-Agent": UA, "Accept-Language": "pt-BR,pt;q=0.9" } });
    if (!res.ok) throw new Error(`Caixa respondeu ${res.status} ${res.statusText}`);
    data = Buffer.from(await res.arrayBuffer());
  }
  console.log(`Arquivo: ${(data.length / 1024).toFixed(0)} KB. Enviando...`);

  const res = await fetch(IMPORT_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${IMPORT_TOKEN}`, "Content-Type": "text/csv" },
    body: new Uint8Array(data),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Servidor respondeu ${res.status}: ${JSON.stringify(json)}`);
  console.log("OK:", JSON.stringify(json));
}

main().catch((e) => {
  console.error("Falha:", e instanceof Error ? e.message : e);
  process.exit(1);
});
