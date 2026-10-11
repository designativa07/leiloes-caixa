import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { replaceCaixaAuctionItemsFromUrl } from "@/lib/importers/caixaImport";

function buildAdminRedirect(request: Request, search: string) {
  // Redirect relativo: atras do proxy do Coolify request.url aponta para localhost:3000.
  return new NextResponse(null, { status: 303, headers: { Location: `/admin${search}` } });
}

export async function POST(request: Request) {
  try {
    const url = "https://venda-imoveis.caixa.gov.br/listaweb/Lista_imoveis_geral.csv";
    const result = await replaceCaixaAuctionItemsFromUrl(url);

    revalidatePath("/");
    revalidatePath("/imoveis");
    revalidatePath("/admin");

    return buildAdminRedirect(request, `?status=success&count=${result.count}&source=download`);
  } catch (error) {
    const message =
      error instanceof Error ? encodeURIComponent(error.message) : encodeURIComponent("Falha ao baixar e importar lista.");

    return buildAdminRedirect(request, `?status=import-error&message=${message}`);
  }
}
