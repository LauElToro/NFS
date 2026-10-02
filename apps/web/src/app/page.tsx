import Link from "next/link";
import { getSession } from "@/lib/session";

export default async function HomePage() {
  const session = await getSession();

  return (
    <main>
      <header className="container site-header">
        <Link href="/" className="brand" aria-label="ReviewsGO">
          <img className="brand-logo" src="/reviewsgo-logo.png" alt="" />
          <span className="brand-name">ReviewsGO</span>
        </Link>
        <nav style={{ display: "flex", gap: "0.75rem" }}>
          {session ? (
            <Link className="btn" href="/app">
              Ir al panel
            </Link>
          ) : (
            <Link className="btn" href="/login">
              Entrar
            </Link>
          )}
        </nav>
      </header>

      <section className="container hero">
        <img className="logo-lg" src="/reviewsgo-logo.png" alt="ReviewsGO" />
        <p className="eyebrow">Carteles de reseñas con QR y NFC</p>
        <h1>ReviewsGO</h1>
        <p className="page-lead muted">
          Imprimí el cartel una vez. Cambiá el destino de las reseñas cuando quieras, sin reimprimir el QR.
        </p>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <Link className="btn" href={session ? "/app" : "/login"}>
            {session ? "Abrir panel" : "Entrar al panel"}
          </Link>
        </div>
      </section>
    </main>
  );
}
