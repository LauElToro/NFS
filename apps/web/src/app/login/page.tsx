import Link from "next/link";
import { loginAction } from "@/app/actions";
import { AuthForm } from "@/components/AuthForm";

export default function LoginPage() {
  return (
    <main className="container" style={{ padding: "4rem 0", maxWidth: 480 }}>
      <h1>Entrar</h1>
      <AuthForm action={loginAction} submitLabel="Entrar" />
      <p className="muted">
        ¿No tenés cuenta? <Link href="/register">Registrate</Link>
      </p>
    </main>
  );
}
