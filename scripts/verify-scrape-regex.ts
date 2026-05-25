import { extractAuctionInfo } from "./auction-date-parser";

const fixedNow = new Date("2026-05-01T00:00:00Z");

const samples: { name: string; html: string; expected: { dateISO: string | null; type: string | null } }[] = [
  {
    name: "Leilao SFI 1o Leilao futuro",
    html: `<html><body>Data do 1º Leilão - 08/06/2026 - 10h00</body></html>`,
    expected: { dateISO: "2026-06-08T10:00:00.000Z", type: "leilao_1praca" },
  },
  {
    name: "Leilao SFI 2o Leilao quando 1o ja passou",
    html: `<html><body>Data do 1º Leilão - 01/04/2026 - 10h00<br>Data do 2º Leilão - 12/06/2026 - 10h00</body></html>`,
    expected: { dateISO: "2026-06-12T10:00:00.000Z", type: "leilao_2praca" },
  },
  {
    name: "Licitacao Aberta",
    html: `<html><body>Data da Licitação Aberta - 27/05/2026 - 10h00</body></html>`,
    expected: { dateISO: "2026-05-27T10:00:00.000Z", type: "licitacao_fim" },
  },
  {
    name: "Variacao sem acento (1o em vez de 1o)",
    html: `<html><body>Data do 1o Leilao - 15/06/2026 - 14h30</body></html>`,
    expected: { dateISO: "2026-06-15T14:30:00.000Z", type: "leilao_1praca" },
  },
  {
    name: "HTML sem data",
    html: `<html><body>nada aqui</body></html>`,
    expected: { dateISO: null, type: null },
  },
];

let failures = 0;
for (const s of samples) {
  const result = extractAuctionInfo(s.html, fixedNow);
  const dateISO = result.date?.toISOString() ?? null;
  if (dateISO !== s.expected.dateISO || result.type !== s.expected.type) {
    console.error(`FAIL [${s.name}]: esperado ${JSON.stringify(s.expected)}, recebido { dateISO: ${dateISO}, type: ${result.type} }`);
    failures++;
  } else {
    console.log(`OK [${s.name}]`);
  }
}

if (failures > 0) {
  console.error(`\n${failures} falhas.`);
  process.exit(1);
}
console.log("\nTodos os casos passaram.");
