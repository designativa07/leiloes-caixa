import { timingSafeEqual } from "node:crypto";

import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import {
  decodeCaixaBuffer,
  replaceCaixaAuctionItemsFromContent,
  replaceCaixaAuctionItemsFromUrl,
} from "@/lib/importers/caixaImport";

export const maxDuration = 300;

const CAIXA_URL = "https://venda-imoveis.caixa.gov.br/listaweb/Lista_imoveis_geral.csv";

function isAuthorized(request: Request) {
  const token = process.env.IMPORT_TOKEN;
  if (!token) return false;
  const received = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const a = Buffer.from(received);
  const b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b);
}

// POST com corpo (CSV cru ou multipart "csvFile") -> importa o arquivo enviado.
// POST sem corpo -> o servidor tenta baixar da Caixa (pode ser bloqueado por Radware).
export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  try {
    let result;
    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      const file = (await request.formData()).get("csvFile");
      if (!(file instanceof File) || file.size === 0) {
        return NextResponse.json({ error: "Campo csvFile ausente" }, { status: 400 });
      }
      result = await replaceCaixaAuctionItemsFromContent(decodeCaixaBuffer(await file.arrayBuffer()));
    } else {
      const body = await request.arrayBuffer();
      result =
        body.byteLength > 0
          ? await replaceCaixaAuctionItemsFromContent(decodeCaixaBuffer(body))
          : await replaceCaixaAuctionItemsFromUrl(CAIXA_URL);
    }

    revalidatePath("/");
    revalidatePath("/imoveis");
    revalidatePath("/admin");

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao importar";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
