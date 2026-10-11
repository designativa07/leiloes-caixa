import { resolve } from "node:path";

import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { replaceCaixaAuctionItemsFromFile } from "@/lib/importers/caixaImport";

function buildAdminRedirect(request: Request, search: string) {
  // Redirect relativo: atras do proxy do Coolify request.url aponta para localhost:3000.
  return new NextResponse(null, { status: 303, headers: { Location: `/admin${search}` } });
}

export async function POST(request: Request) {
  try {
    const csvPath = resolve(process.cwd(), "Lista_imoveis_geral.csv");
    const result = await replaceCaixaAuctionItemsFromFile(csvPath);

    revalidatePath("/");
    revalidatePath("/imoveis");
    revalidatePath("/admin");

    return buildAdminRedirect(request, `?status=success&count=${result.count}&source=padrao`);
  } catch (error) {
    const message =
      error instanceof Error ? encodeURIComponent(error.message) : encodeURIComponent("Falha ao reimportar CSV.");

    return buildAdminRedirect(request, `?status=import-error&message=${message}`);
  }
}
