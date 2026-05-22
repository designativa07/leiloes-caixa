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
