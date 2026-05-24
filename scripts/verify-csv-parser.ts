import { parseCaixaCsvContent } from "../src/lib/importers/caixaCsv";

const sample = `Lista de Imóveis da Caixa;;Data de geração:;22/05/2026;;;;;;;
 N° do imóvel;UF;Cidade;Bairro;Endereço;Preço;Valor de avaliação;Desconto;Financiamento;Descrição;Modalidade de venda;Link de acesso

 1444411617560 ;SC ;ABELARDO LUZ ;CENTRO ;R BAHIA, N. 569, QD 14 LT 22 ;500.000,00;500.000,00;0.00;Não;Casa, 0.00 de área total.;Leilão SFI - Edital Único;https://venda-imoveis.caixa.gov.br/sistema/detalhe-imovel.asp?hdnimovel=1444411617560
`;

const result = parseCaixaCsvContent(sample);

if (!result.generatedAt) {
  console.error("FAIL: generatedAt ausente");
  process.exit(1);
}

const dateStr = result.generatedAt.toISOString().slice(0, 10);
if (dateStr !== "2026-05-22") {
  console.error(`FAIL: generatedAt esperado 2026-05-22, recebido ${dateStr}`);
  process.exit(1);
}

if (result.items.length !== 1) {
  console.error(`FAIL: esperado 1 item, recebido ${result.items.length}`);
  process.exit(1);
}

if (result.items[0].externalId !== "1444411617560") {
  console.error(`FAIL: externalId errado: ${result.items[0].externalId}`);
  process.exit(1);
}

console.log("OK: parser extrai generatedAt e items corretamente.");
