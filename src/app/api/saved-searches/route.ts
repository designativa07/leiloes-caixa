import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { buildAuctionItemWhere, type PropertyListFilters } from "@/lib/auction-items";
import { NextResponse } from "next/server";

// GET /api/saved-searches
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searches = await db.savedSearch.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(searches);
}

// POST /api/saved-searches
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, filters } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
  }

  const search = await db.savedSearch.create({
    data: {
      userId: session.user.id,
      name: name.trim(),
      filters,
    },
  });

  // Seed: marca todos os imoveis que ja batem com os filtros como "vistos",
  // para que o proximo email so contenha imoveis realmente novos.
  const where = buildAuctionItemWhere(filters as PropertyListFilters);
  const currentMatches = await db.auctionItem.findMany({
    where,
    select: { externalId: true },
  });

  if (currentMatches.length > 0) {
    await db.savedSearchSeen.createMany({
      data: currentMatches.map((m) => ({
        savedSearchId: search.id,
        externalId: m.externalId,
      })),
      skipDuplicates: true,
    });
  }

  return NextResponse.json(search, { status: 201 });
}

// DELETE /api/saved-searches?id=X
export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id"));

  await db.savedSearch.deleteMany({
    where: { id, userId: session.user.id },
  });

  return NextResponse.json({ ok: true });
}
