import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

type Params = Promise<{ id: string }>;

// POST /api/favorites/[id] — add favorite
export async function POST(_req: Request, { params }: { params: Params }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const auctionItemId = Number(id);

  try {
    const favorite = await db.favorite.create({
      data: { userId: session.user.id, auctionItemId },
    });
    return NextResponse.json(favorite, { status: 201 });
  } catch {
    // Already exists (unique constraint) — return ok
    return NextResponse.json({ ok: true });
  }
}

// DELETE /api/favorites/[id] — remove favorite
export async function DELETE(_req: Request, { params }: { params: Params }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const auctionItemId = Number(id);

  await db.favorite.deleteMany({
    where: { userId: session.user.id, auctionItemId },
  });

  return NextResponse.json({ ok: true });
}

// GET /api/favorites/[id] — check if favorited
export async function GET(_req: Request, { params }: { params: Params }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ favorited: false });
  }

  const { id } = await params;
  const auctionItemId = Number(id);

  const favorite = await db.favorite.findUnique({
    where: {
      userId_auctionItemId: {
        userId: session.user.id,
        auctionItemId,
      },
    },
  });

  return NextResponse.json({ favorited: !!favorite });
}
