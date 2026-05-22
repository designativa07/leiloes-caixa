import { Prisma } from "@/generated/prisma/client";

import { db } from "@/lib/db";

const PAGE_SIZE = 20;

export type PropertyListFilters = {
  search?: string;
  state?: string;
  city?: string;
  saleMode?: string;
  financing?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
  page?: string;
};

export function normalizeFilters(filters: PropertyListFilters) {
  const page = Math.max(Number(filters.page ?? "1") || 1, 1);

  return {
    search: filters.search?.trim() ?? "",
    state: filters.state?.trim() ?? "",
    city: filters.city?.trim() ?? "",
    saleMode: filters.saleMode?.trim() ?? "",
    financing: filters.financing?.trim() ?? "",
    minPrice: filters.minPrice?.trim() ?? "",
    maxPrice: filters.maxPrice?.trim() ?? "",
    sort: filters.sort?.trim() ?? "discount_desc",
    page,
    pageSize: PAGE_SIZE,
  };
}

function buildAuctionItemOrder(sort: string): Prisma.AuctionItemOrderByWithRelationInput[] {
  switch (sort) {
    case "price_asc":
      return [{ price: "asc" }, { discountPercent: "desc" }];
    case "price_desc":
      return [{ price: "desc" }, { discountPercent: "desc" }];
    case "discount_asc":
      return [{ discountPercent: "asc" }, { price: "asc" }];
    case "discount_desc":
    default:
      return [{ discountPercent: "desc" }, { price: "asc" }];
  }
}

function parsePriceInput(value: string) {
  if (!value) {
    return undefined;
  }

  const normalized = value.replace(/\./g, "").replace(",", ".");
  const parsed = Number(normalized);
  return Number.isNaN(parsed) ? undefined : parsed;
}

export function buildAuctionItemWhere(filters: PropertyListFilters): Prisma.AuctionItemWhereInput {
  const normalized = normalizeFilters(filters);
  const andFilters: Prisma.AuctionItemWhereInput[] = [
    {
      source: "caixa",
      category: "imovel",
    },
  ];

  if (normalized.search) {
    andFilters.push({
      OR: [
        { externalId: { contains: normalized.search, mode: "insensitive" } },
        { city: { contains: normalized.search, mode: "insensitive" } },
        { district: { contains: normalized.search, mode: "insensitive" } },
        { address: { contains: normalized.search, mode: "insensitive" } },
      ],
    });
  }

  if (normalized.city) {
    andFilters.push({ city: normalized.city });
  }

  if (normalized.state) {
    andFilters.push({ state: normalized.state });
  }

  if (normalized.saleMode) {
    andFilters.push({ saleMode: normalized.saleMode });
  }

  if (normalized.financing === "sim") {
    andFilters.push({ allowsFinancing: true });
  }

  if (normalized.financing === "nao") {
    andFilters.push({ allowsFinancing: false });
  }

  const minPrice = parsePriceInput(normalized.minPrice);
  const maxPrice = parsePriceInput(normalized.maxPrice);

  if (minPrice !== undefined || maxPrice !== undefined) {
    andFilters.push({
      price: {
        ...(minPrice !== undefined ? { gte: minPrice } : {}),
        ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
      },
    });
  }

  return { AND: andFilters };
}

export async function getPropertyFilterOptions() {
  const [states, cities, saleModes] = await Promise.all([
    db.auctionItem.findMany({
      where: { source: "caixa", category: "imovel" },
      distinct: ["state"],
      select: { state: true },
      orderBy: { state: "asc" },
    }),
    db.auctionItem.findMany({
      where: { source: "caixa", category: "imovel" },
      distinct: ["city"],
      select: { city: true },
      orderBy: { city: "asc" },
    }),
    db.auctionItem.findMany({
      where: { source: "caixa", category: "imovel" },
      distinct: ["saleMode"],
      select: { saleMode: true },
      orderBy: { saleMode: "asc" },
    }),
  ]);

  return {
    states: states.map((item) => item.state),
    cities: cities.map((item) => item.city),
    saleModes: saleModes.map((item) => item.saleMode),
  };
}

export async function getPropertyList(filters: PropertyListFilters) {
  const normalized = normalizeFilters(filters);
  const where = buildAuctionItemWhere(filters);
  const skip = (normalized.page - 1) * normalized.pageSize;
  const orderBy = buildAuctionItemOrder(normalized.sort);

  const [items, total] = await Promise.all([
    db.auctionItem.findMany({
      where,
      orderBy,
      skip,
      take: normalized.pageSize,
    }),
    db.auctionItem.count({ where }),
  ]);

  return {
    items,
    total,
    page: normalized.page,
    pageSize: normalized.pageSize,
    totalPages: Math.max(Math.ceil(total / normalized.pageSize), 1),
  };
}

export async function getPropertySummary() {
  const [count, cheapest] = await Promise.all([
    db.auctionItem.count({
      where: { source: "caixa", category: "imovel" },
    }),
    db.auctionItem.findFirst({
      where: { source: "caixa", category: "imovel" },
      orderBy: { price: "asc" },
      select: { price: true },
    }),
  ]);

  return {
    count,
    cheapestPrice: cheapest?.price ? Number(cheapest.price) : null,
  };
}
