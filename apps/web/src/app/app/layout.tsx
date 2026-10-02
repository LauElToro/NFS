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
  const account = await findAccount(session.id);
  if (!account || !account.active) redirect("/login");

  return (
    <AppShell name={account.name} email={account.email} role={account.role}>
      {children}
    </AppShell>
  );
}
