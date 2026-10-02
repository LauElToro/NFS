import { loginAction } from "@/app/actions";
import { AuthForm } from "@/components/AuthForm";

export default function LoginPage() {
  return (
    <main className="auth-screen">
      <section className="auth-card card-panel stack">
        <p className="muted" style={{ margin: 0, letterSpacing: "0.08em", textTransform: "uppercase", fontSize: "0.75rem" }}>
          NFS QR
        </p>
        <h1 style={{ margin: 0 }}>Entrar</h1>
        <AuthForm action={loginAction} submitLabel="Entrar" />
        <p className="muted" style={{ margin: 0 }}>Si sos revendedor, entrá con el usuario que te dio el administrador.</p>
      </section>
    </main>
  );
}
