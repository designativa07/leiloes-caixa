import { parse } from "csv-parse/sync";
import { z } from "zod";
import { readFile } from "node:fs/promises";

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

export async function parseCaixaCsvFile(filePath: string): Promise<ParsedAuctionItem[]> {
  const fileContent = await readFile(filePath, "utf-8");
  return parseCaixaCsvContent(fileContent);
}

export function parseCaixaCsvContent(fileContent: string): ParsedAuctionItem[] {
  const rows = parse(fileContent, {
    delimiter: ";",
    relax_column_count: true,
    skip_empty_lines: false,
  }) as string[][];

  const dataRows = rows.slice(3).filter((row) => row.some((cell) => normalizeText(cell ?? "") !== ""));

  return dataRows.map((row, index) => {
    const record = Object.fromEntries(
      headers.map((header, headerIndex) => [header, normalizeText(row[headerIndex] ?? "")]),
    );

    const validation = rawAuctionItemSchema.safeParse(record);

    if (!validation.success) {
      const issue = validation.error.issues[0];
      const fieldName = String(issue?.path?.[0] ?? "desconhecido");
      const fieldLabel = fieldLabels[fieldName] ?? fieldName;
      throw new Error(`Linha ${index + 4} invalida: campo "${fieldLabel}" ausente ou invalido.`);
    }

    const validated = validation.data;

    return {
      source: "caixa",
      category: "imovel",
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
}
