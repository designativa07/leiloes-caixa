import { parse } from "csv-parse/sync";
import { z } from "zod";
import { readFile } from "node:fs/promises";

const GENERATED_AT_REGEX = /Data de gera[çc][ãa]o[^0-9]*?(\d{2})\/(\d{2})\/(\d{4})/i;

function parseGeneratedAt(headerLine: string): Date {
  const match = headerLine.match(GENERATED_AT_REGEX);
  if (!match) {
    throw new Error(
      `Cabecalho do CSV nao contem 'Data de geracao'. Linha recebida (300 chars): "${headerLine.slice(0, 300)}"`,
    );
  }
  const [, day, month, year] = match;
  return new Date(`${year}-${month}-${day}T00:00:00.000Z`);
}

const fieldLabels: Record<string, string> = {
  externalId: "numero do imovel",
  state: "UF",
  city: "cidade",
  district: "bairro",
  address: "endereco",
  price: "preco",
  appraisalValue: "valor de avaliacao",
  discountPercent: "desconto",
  financing: "financiamento",
  description: "descricao",
  saleMode: "modalidade de venda",
  sourceUrl: "link de acesso",
};

const rawAuctionItemSchema = z.object({
  externalId: z.string().min(1),
  state: z.string().min(2),
  city: z.string().min(1),
  district: z.string(),
  address: z.string().min(1),
  price: z.string().min(1),
  appraisalValue: z.string().min(1),
  discountPercent: z.string().min(1),
  financing: z.string().min(1),
  description: z.string().min(1),
  saleMode: z.string().min(1),
  sourceUrl: z.url(),
});

type ParsedAuctionItem = {
  source: "caixa";
  category: "imovel";
  externalId: string;
  state: string;
  city: string;
  district: string;
  address: string;
  price: string;
  appraisalValue: string | null;
  discountPercent: string | null;
  allowsFinancing: boolean;
  description: string;
  saleMode: string;
  sourceUrl: string;
};

const headers = [
  "externalId",
  "state",
  "city",
  "district",
  "address",
  "price",
  "appraisalValue",
  "discountPercent",
  "financing",
  "description",
  "saleMode",
  "sourceUrl",
] as const;

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeDistrict(value: string) {
  const normalized = normalizeText(value);
  return normalized || "Nao informado";
}

function normalizeDecimal(value: string) {
  const sanitized = normalizeText(value);
  const normalized = sanitized.includes(",")
    ? sanitized.replace(/\./g, "").replace(",", ".")
    : sanitized;
  const parsed = Number(normalized);

  if (Number.isNaN(parsed)) {
    throw new Error(`Valor numerico invalido: ${value}`);
  }

  return parsed.toFixed(2);
}

function normalizeFinancing(value: string) {
  return normalizeText(value).toLowerCase() === "sim";
}

export async function parseCaixaCsvFile(filePath: string): Promise<{ generatedAt: Date; items: ParsedAuctionItem[] }> {
  const fileContent = await readFile(filePath, "latin1");
  return parseCaixaCsvContent(fileContent);
}

export function parseCaixaCsvContent(fileContent: string): { generatedAt: Date; items: ParsedAuctionItem[] } {
  const rows = parse(fileContent, {
    delimiter: ";",
    relax_column_count: true,
    skip_empty_lines: false,
  }) as string[][];

  // O layout da Caixa varia (linhas em branco no topo): localiza o cabecalho pelo conteudo.
  const headerIndex = rows.findIndex((row) => {
    const cells = row.map((c) => normalizeText(c ?? "").toLowerCase());
    return cells.includes("uf") && cells.includes("cidade");
  });
  if (headerIndex === -1) {
    throw new Error(
      "Cabecalho de colunas (UF; Cidade; ...) nao encontrado. O arquivo e a lista de imoveis da Caixa?",
    );
  }

  const preamble = rows.slice(0, headerIndex).map((r) => r.join(";")).join(" ");
  const generatedAt = parseGeneratedAt(preamble);

  const dataRows = rows.slice(headerIndex + 1).filter((row) => row.some((cell) => normalizeText(cell ?? "") !== ""));

  const items = dataRows.map((row, index) => {
    const record = Object.fromEntries(
      headers.map((header, headerIndex) => [header, normalizeText(row[headerIndex] ?? "")]),
    );

    const validation = rawAuctionItemSchema.safeParse(record);

    if (!validation.success) {
      const issue = validation.error.issues[0];
      const fieldName = String(issue?.path?.[0] ?? "desconhecido");
      const fieldLabel = fieldLabels[fieldName] ?? fieldName;
      throw new Error(`Linha ${index + headerIndex + 2} invalida: campo "${fieldLabel}" ausente ou invalido.`);
    }

    const validated = validation.data;

    return {
      source: "caixa" as const,
      category: "imovel" as const,
      externalId: validated.externalId,
      state: validated.state,
      city: validated.city,
      district: normalizeDistrict(validated.district),
      address: validated.address,
      price: normalizeDecimal(validated.price),
      appraisalValue: normalizeDecimal(validated.appraisalValue),
      discountPercent: normalizeDecimal(validated.discountPercent),
      allowsFinancing: normalizeFinancing(validated.financing),
      description: validated.description,
      saleMode: validated.saleMode,
      sourceUrl: validated.sourceUrl,
    };
  });

  return { generatedAt, items };
}
