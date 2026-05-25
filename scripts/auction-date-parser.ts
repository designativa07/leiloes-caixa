const DATE_PATTERN = String.raw`(\d{2})\/(\d{2})\/(\d{4})(?:[^0-9]+(?:às\s+)?(\d{1,2}):(\d{2}))?`;
const PRACA_1_REGEX = new RegExp(`1[ªa]\\s*Pra[çc]a[^0-9]*?${DATE_PATTERN}`, "i");
const PRACA_2_REGEX = new RegExp(`2[ªa]\\s*Pra[çc]a[^0-9]*?${DATE_PATTERN}`, "i");
const LICITACAO_REGEX = new RegExp(`(?:prazo\\s+final|encerramento|fim\\s+do\\s+prazo)[^0-9]*?${DATE_PATTERN}`, "i");

export type AuctionInfo = { date: Date | null; type: string | null };

function buildDate(match: RegExpMatchArray): Date {
  const [, day, month, year, hour, minute] = match;
  const h = hour ?? "00";
  const m = minute ?? "00";
  return new Date(`${year}-${month}-${day}T${h.padStart(2, "0")}:${m.padStart(2, "0")}:00`);
}

export function extractAuctionInfo(html: string, now: Date = new Date()): AuctionInfo {
  const m1 = html.match(PRACA_1_REGEX);
  const m2 = html.match(PRACA_2_REGEX);

  if (m1) {
    const date1 = buildDate(m1);
    if (date1 > now) return { date: date1, type: "leilao_1praca" };
    if (m2) {
      const date2 = buildDate(m2);
      return { date: date2, type: "leilao_2praca" };
    }
    return { date: date1, type: "leilao_1praca" };
  }

  if (m2) {
    return { date: buildDate(m2), type: "leilao_2praca" };
  }

  const ml = html.match(LICITACAO_REGEX);
  if (ml) {
    return { date: buildDate(ml), type: "licitacao_fim" };
  }

  return { date: null, type: null };
}

export function isContinuousSaleMode(saleMode: string): boolean {
  const m = saleMode.toLowerCase();
  return m.startsWith("venda direta") || m === "venda online";
}
