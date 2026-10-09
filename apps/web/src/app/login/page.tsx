import { loginAction } from "@/app/actions";
import { AuthForm } from "@/components/AuthForm";
import { safeConfigPath } from "@/lib/poster-lookup";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const next = safeConfigPath((await searchParams).next || "");
  return (
    <main className="auth-screen">
      <section className="auth-card card-panel stack">
        <img className="brand-logo" src="/reviewsgo-logo.png" alt="ReviewsGO" />
        <h1 style={{ margin: 0 }}>Entrar</h1>
        <AuthForm action={loginAction} submitLabel="Entrar" next={next || undefined} />
        <p className="muted" style={{ margin: 0 }}>Si sos revendedor, entrá con el usuario que te dio el administrador.</p>
      </section>
    </main>
  );
}
