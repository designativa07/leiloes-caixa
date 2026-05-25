import { extractAuctionInfo } from "./auction-date-parser";

const fixedNow = new Date("2026-05-01T00:00:00");

const samples: { name: string; html: string; expected: { dateISO: string | null; type: string | null } }[] = [
  {
    name: "Leilao SFI 1a Praca futura",
    html: `<html><body>1ª Praça: 15/06/2026 às 14:00 horas</body></html>`,
    expected: { dateISO: "2026-06-15T14:00:00.000Z", type: "leilao_1praca" },
  },
  {
    name: "Leilao SFI 2a Praca",
    html: `<html><body>2ª Praça: 22/06/2026 às 14:00 horas</body></html>`,
    expected: { dateISO: "2026-06-22T14:00:00.000Z", type: "leilao_2praca" },
  },
  {
    name: "Licitacao com prazo final",
    html: `<html><body>Prazo final para envio de propostas: 30/06/2026</body></html>`,
    expected: { dateISO: "2026-06-30T00:00:00.000Z", type: "licitacao_fim" },
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
  // Comparamos em UTC; o construtor `new Date('YYYY-MM-DDTHH:mm:ss')` interpreta como horário local,
  // então o ISO virá com offset. Para o teste, usamos um Date fixo construído via UTC e comparamos a string ISO.
  const dateISO = result.date ? new Date(Date.UTC(
    result.date.getFullYear(), result.date.getMonth(), result.date.getDate(),
    result.date.getHours(), result.date.getMinutes(), result.date.getSeconds()
  )).toISOString() : null;
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
