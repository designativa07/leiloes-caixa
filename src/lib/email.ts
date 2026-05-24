import { Resend } from "resend";

// Lazy initialization to avoid build-time errors when RESEND_API_KEY is not set
function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

export async function sendAlertEmail({
  to,
  userName,
  searchName,
  matchCount,
  filters,
}: {
  to: string;
  userName: string;
  searchName: string;
  matchCount: number;
  filters: Record<string, string>;
}) {
  const filterParts: string[] = [];
  if (filters.state) filterParts.push(`Estado: ${filters.state}`);
  if (filters.city) filterParts.push(`Cidade(s): ${filters.city}`);
  if (filters.saleMode) filterParts.push(`Modalidade: ${filters.saleMode}`);
  if (filters.financing === "sim") filterParts.push("Aceita financiamento");
  if (filters.minPrice) filterParts.push(`Preço mínimo: R$ ${filters.minPrice}`);
  if (filters.maxPrice) filterParts.push(`Preço máximo: R$ ${filters.maxPrice}`);

  const filtersSummary = filterParts.length > 0 ? filterParts.join(" · ") : "Todos os imóveis";

  const appUrl = process.env.NEXTAUTH_URL ?? "https://leiloes-caixa.com";
  const searchParams = new URLSearchParams(filters as Record<string, string>);
  const listUrl = `${appUrl}/imoveis?${searchParams.toString()}`;

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#080b11;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="background:linear-gradient(135deg,#111e3b 0%,#090e18 100%);border:1px solid rgba(255,255,255,0.08);border-radius:24px;padding:40px;color:#f3f4f6;">
      
      <div style="margin-bottom:32px;">
        <div style="display:inline-block;background:rgba(59,130,246,0.12);border:1px solid rgba(59,130,246,0.2);color:#60a5fa;padding:6px 14px;border-radius:99px;font-size:13px;font-weight:700;letter-spacing:0.03em;text-transform:uppercase;">
          🏠 Caixa Leilões
        </div>
      </div>

      <h1 style="font-size:26px;font-weight:800;letter-spacing:-0.02em;margin:0 0 12px;color:#fff;">
        ${matchCount} novo${matchCount > 1 ? "s imóvel" : " imóvel"} encontrado${matchCount > 1 ? "s" : ""}!
      </h1>
      
      <p style="color:#9ca3af;font-size:16px;line-height:1.6;margin:0 0 24px;">
        Olá${userName ? `, ${userName.split(" ")[0]}` : ""}! Encontramos imóveis novos que correspondem à sua busca salva <strong style="color:#fff;">"${searchName}"</strong>.
      </p>

      <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:16px;padding:20px;margin-bottom:32px;">
        <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#6b7280;margin-bottom:8px;">Filtros da busca</div>
        <div style="color:#d1d5db;font-size:15px;">${filtersSummary}</div>
      </div>

      <a href="${listUrl}" style="display:inline-block;background:#2563eb;color:#fff;font-weight:700;font-size:16px;padding:16px 32px;border-radius:14px;text-decoration:none;letter-spacing:-0.01em;">
        Ver ${matchCount} imóve${matchCount > 1 ? "is" : "l"} →
      </a>

      <p style="margin-top:40px;color:#4b5563;font-size:13px;line-height:1.6;">
        Você recebeu este email porque salvou uma busca no Portal Leilões Caixa.<br>
        Para cancelar os alertas, acesse sua conta e remova a busca salva.
      </p>
    </div>
  </div>
</body>
</html>`;

  const resend = getResend();
  if (!resend) {
    console.warn("RESEND_API_KEY not configured — skipping email alert");
    return;
  }

  return resend.emails.send({
    from: "Leilões Caixa <alertas@leilaoscaixa.com.br>",
    to,
    subject: `🏠 ${matchCount} novo${matchCount > 1 ? "s imóveis" : " imóvel"} para "${searchName}"`,
    html,
  });
}
