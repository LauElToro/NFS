import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { findAccount } from "@/lib/accounts";
import { getSession } from "@/lib/session";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  let account;
  try {
    account = await findAccount(session.id);
  } catch (error) {
    console.error(error);
    return (
      <main className="auth-screen">
        <section className="auth-card card-panel stack">
          <h1>No se pudo abrir el panel</h1>
          <p>Los carteles y las cuentas siguen guardados. Recargá la página.</p>
        </section>
      </main>
    );
  }
  if (!account || !account.active) redirect("/login");

  return (
    <AppShell name={account.name} email={account.email} role={account.role}>
      {children}
    </AppShell>
  );
}
