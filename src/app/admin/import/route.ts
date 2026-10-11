import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { decodeCaixaBuffer, replaceCaixaAuctionItemsFromContent } from "@/lib/importers/caixaImport";

function buildAdminRedirect(request: Request, search: string) {
  // Redirect relativo: atras do proxy do Coolify request.url aponta para localhost:3000.
  return new NextResponse(null, { status: 303, headers: { Location: `/admin${search}` } });
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("csvFile");

    if (!(file instanceof File) || file.size === 0) {
      return buildAdminRedirect(request, "?status=error");
    }

    const content = decodeCaixaBuffer(await file.arrayBuffer());
    const result = await replaceCaixaAuctionItemsFromContent(content);

    revalidatePath("/");
    revalidatePath("/imoveis");
    revalidatePath("/admin");

    return buildAdminRedirect(request, `?status=success&count=${result.count}&source=upload`);
  } catch (error) {
    const message =
      error instanceof Error ? encodeURIComponent(error.message) : encodeURIComponent("Falha ao importar CSV.");

    return buildAdminRedirect(request, `?status=import-error&message=${message}`);
  }
}
