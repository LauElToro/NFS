import Link from "next/link";

export default function RegisterPage() {
  return (
    <main className="auth-screen">
      <section className="auth-card card-panel stack">
      <img className="brand-logo" src="/reviewsgo-logo.png" alt="ReviewsGO" />
      <h1 style={{ margin: 0 }}>Crear cuenta</h1>
      <p className="muted" style={{ margin: 0 }}>Las cuentas de revendedor las crea el administrador.</p>
      <p>
        <Link className="btn" href="/login">
          Entrar
        </Link>
      </p>
      </section>
    </main>
  );
}
