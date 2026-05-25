export function formatCurrency(value: number | string) {
  const amount = typeof value === "string" ? Number(value) : value;

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatPercent(value: number | string | null | undefined) {
  if (value === null || value === undefined) {
    return "-";
  }

  const amount = typeof value === "string" ? Number(value) : value;
  return `${amount.toFixed(2)}%`;
}

export function formatFinancing(value: boolean) {
  return value ? "Sim" : "Nao";
}

export function buildPageHref(
  pathname: string,
  searchParams: Record<string, string | undefined>,
) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (value) {
      params.set(key, value);
    }
  }

  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function getPropertyImage(externalId: string): string {
  const cleanedId = (externalId ?? "").trim();
  // Pad standard externalIds with leading zeros to reach exactly 13 digits
  const paddedId = cleanedId.padStart(13, "0");
  return `https://venda-imoveis.caixa.gov.br/fotos/F${paddedId}21.jpg`;
}

const AUCTION_TYPE_LABELS: Record<string, string> = {
  leilao_1praca: "1ª Praça",
  leilao_2praca: "2ª Praça",
  licitacao_fim: "Fim das propostas",
  continua: "Contínua",
};

export function formatAuctionDate(
  date: Date | null,
  type: string | null,
): { primary: string; secondary?: string; kind: "date" | "continua" | "none" } {
  if (type === "continua") {
    return { primary: "Contínua", kind: "continua" };
  }
  if (!date || !type) {
    return { primary: "-", kind: "none" };
  }
  const d = new Date(date);
  const primary = d.toLocaleDateString("pt-BR", { timeZone: "UTC" });
  const secondary = AUCTION_TYPE_LABELS[type] ?? type;
  return { primary, secondary, kind: "date" };
}
