import { resolve } from "node:path";

import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { replaceCaixaAuctionItemsFromFile } from "@/lib/importers/caixaImport";

function buildAdminRedirect(request: Request, search: string) {
  return NextResponse.redirect(new URL(`/admin${search}`, request.url), 303);
}

export async function POST(request: Request) {
  try {
    const csvPath = resolve(process.cwd(), "Lista_imoveisSC.csv");
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
