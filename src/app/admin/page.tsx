import Link from "next/link";
import { db } from "@/lib/db";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function getSingleValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const resolvedSearchParams = await searchParams;
  const [count, latestItem] = await Promise.all([
    db.auctionItem.count({
      where: { source: "caixa", category: "imovel" },
    }),
    db.auctionItem.findFirst({
      where: { source: "caixa", category: "imovel" },
      orderBy: { updatedAt: "desc" },
      select: {
        importBatch: true,
        updatedAt: true,
      },
    }),
  ]);

  const status = getSingleValue(resolvedSearchParams.status);
  const importedCount = getSingleValue(resolvedSearchParams.count);
  const source = getSingleValue(resolvedSearchParams.source);
  const message = getSingleValue(resolvedSearchParams.message);

  return (
    <main className="page-shell">
      <div className="container">
        <section className="hero">
          <span className="badge">Area administrativa</span>
          <h1>Importacao rapida da Caixa</h1>
          <p>
            Esta area administrativa inicial serve apenas para reimportar o CSV da Caixa pela
            interface. Mantemos o escopo enxuto para o sistema continuar simples.
          </p>
          <div className="hero-actions">
            <Link className="button" href="/imoveis">
              Ver listagem
            </Link>
            <Link className="button-secondary" href="/">
              Voltar ao inicio
            </Link>
          </div>
        </section>

        <div className="admin-grid" style={{ marginTop: 20 }}>
          <section className="panel">
            <div className="panel-header">
              <div>
                <h2 className="section-title">Reimportar CSV</h2>
                <div className="muted">
                  Envie um novo arquivo CSV ou reimporte o arquivo padrao do projeto.
                </div>
              </div>
            </div>

            {status === "success" ? (
              <div className="status-success">
                Importacao concluida com {importedCount} imoveis via{" "}
                {source === "upload" ? "upload de arquivo" : "arquivo padrao do projeto"}.
              </div>
            ) : status === "error" ? (
              <div className="status-info">
                Selecione um arquivo CSV antes de usar a importacao por upload.
              </div>
            ) : status === "import-error" ? (
              <div className="status-info">
                {message ?? "Nao foi possivel importar o arquivo enviado."}
              </div>
            ) : (
              <div className="status-info">
                Nenhuma importacao executada nesta sessao. Use o formulario abaixo quando quiser
                atualizar os dados.
              </div>
            )}

            <form action="/admin/import" encType="multipart/form-data" method="post">
              <div className="field">
                <label htmlFor="csvFile">Arquivo CSV da Caixa</label>
                <input accept=".csv,text/csv" id="csvFile" name="csvFile" type="file" />
              </div>

              <div className="filters-actions">
                <button className="filters-submit" type="submit">
                  Importar CSV enviado
                </button>
              </div>
            </form>

            <form action="/admin/reimport" method="post" style={{ marginTop: 12 }}>
              <div className="filters-actions">
                <button className="button-danger" type="submit">
                  Reimportar arquivo padrao do projeto
                </button>
              </div>
            </form>
          </section>

          <aside className="detail-sidebar">
            <section className="detail-card">
              <h2 className="section-title">Resumo da base</h2>
              <div className="detail-list">
                <div>
                  <strong>Itens atuais:</strong> {count}
                </div>
                <div>
                  <strong>Ultimo lote:</strong> {latestItem?.importBatch ?? "-"}
                </div>
                <div>
                  <strong>Ultima atualizacao:</strong>{" "}
                  {latestItem?.updatedAt.toLocaleString("pt-BR") ?? "-"}
                </div>
              </div>
            </section>

            <section className="detail-card">
              <h2 className="section-title">Escopo desta fase</h2>
              <div className="detail-list">
                <div>Importacao manual do CSV da Caixa</div>
                <div>Atualizacao imediata da home e da listagem</div>
                <div>Sem login e sem CRUD completo por enquanto</div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
