import Link from "next/link";

export default function NotFound() {
  return (
    <main className="page-shell">
      <div className="container">
        <section className="panel">
          <h1 className="section-title">Imovel nao encontrado</h1>
          <p className="muted">O item solicitado nao existe ou nao esta mais disponivel na base atual.</p>
          <div className="hero-actions">
            <Link className="filters-submit" href="/imoveis">
              Voltar para a listagem
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
