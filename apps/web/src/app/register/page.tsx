import Link from "next/link";
import { registerAction } from "@/app/actions";
import { AuthForm } from "@/components/AuthForm";

export default function RegisterPage() {
  return (
    <main className="container" style={{ padding: "4rem 0", maxWidth: 480 }}>
      <h1>Crear cuenta</h1>
      <p className="muted">Administrá QRs dinámicos y mirá los escaneos.</p>
      <AuthForm action={registerAction} submitLabel="Registrarme" />
      <p className="muted">
        ¿Ya tenés cuenta? <Link href="/login">Entrá</Link>
      </p>
    </main>
  );
}
