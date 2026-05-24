import { db } from "../src/lib/db";

async function main() {
  const existing = await db.importBatch.findFirst({ where: { source: "caixa" } });
  if (existing) {
    console.log("ImportBatch já existe, pulando seed.");
    return;
  }

  const count = await db.auctionItem.count({
    where: { source: "caixa", category: "imovel" },
  });

  const newest = await db.auctionItem.findFirst({
    where: { source: "caixa", category: "imovel" },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });

  await db.importBatch.create({
    data: {
      source: "caixa",
      generatedAt: newest?.createdAt ?? new Date(),
      itemCount: count,
    },
  });

  console.log(`Seed criou ImportBatch com ${count} items, generatedAt=${newest?.createdAt?.toISOString()}.`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
