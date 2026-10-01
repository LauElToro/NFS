import Link from "next/link";

export default function RegisterPage() {
  return (
    <main className="container" style={{ padding: "4rem 0", maxWidth: 480 }}>
      <h1>Crear cuenta</h1>
      <p className="muted">Las cuentas de revendedor las crea el administrador.</p>
      <p>
        <Link className="btn" href="/login">
          Entrar
        </Link>
      </p>
    </main>
  );
}
