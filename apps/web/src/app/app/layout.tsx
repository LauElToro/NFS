import Link from "next/link";
import { redirect } from "next/navigation";
import { logoutAction } from "@/app/actions";
import { getSession } from "@/lib/session";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div>
      <header
        className="container"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "1rem 0",
          borderBottom: "1px solid var(--line)",
          marginBottom: "1.5rem",
          gap: "1rem",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <Link href="/" style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}>
            NFS QR
          </Link>
          <nav style={{ display: "flex", gap: "0.85rem", color: "var(--muted)" }}>
            <Link href="/app">QRs</Link>
            <Link href="/app/kpis">KPIs</Link>
          </nav>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <span className="muted" style={{ fontSize: "0.9rem" }}>
            {session.email}
          </span>
          <form action={logoutAction}>
            <button className="btn secondary" type="submit">
              Salir
            </button>
          </form>
        </div>
      </header>
      <div className="container" style={{ paddingBottom: "3rem" }}>
        {children}
      </div>
    </div>
  );
}
