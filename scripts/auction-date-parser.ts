const DATE_PATTERN = String.raw`(\d{2})\/(\d{2})\/(\d{4})\s*-\s*(\d{1,2})h(\d{2})`;
const LEILAO_1_REGEX = new RegExp(`Data\\s+do\\s+1[ºo]\\s*Leil[ãa]o\\s*-\\s*${DATE_PATTERN}`, "i");
const LEILAO_2_REGEX = new RegExp(`Data\\s+do\\s+2[ºo]\\s*Leil[ãa]o\\s*-\\s*${DATE_PATTERN}`, "i");
const LICITACAO_REGEX = new RegExp(`Data\\s+da\\s+Licita[çc][ãa]o\\s+Aberta\\s*-\\s*${DATE_PATTERN}`, "i");

export type AuctionInfo = { date: Date | null; type: string | null };

function buildDate(match: RegExpMatchArray): Date {
  const [, day, month, year, hour, minute] = match;
  const h = parseInt(hour ?? "00", 10);
  const m = parseInt(minute ?? "00", 10);
  return new Date(Date.UTC(
    parseInt(year, 10),
    parseInt(month, 10) - 1,
    parseInt(day, 10),
    h,
    m,
    0,
  ));
}

export function extractAuctionInfo(html: string, now: Date = new Date()): AuctionInfo {
  const m1 = html.match(LEILAO_1_REGEX);
  const m2 = html.match(LEILAO_2_REGEX);

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
