import Link from "next/link";
import { getContainer } from "@/lib/container";
import { requireSession } from "@/lib/session";
import { createQrAction } from "@/app/actions";
import { CreateQrForm } from "@/components/CreateQrForm";

export default async function AppHomePage() {
  const session = await requireSession();
  const { qrs, scans } = getContainer();
  const list = await qrs.listByOwner(session.id);

  const withCounts = await Promise.all(
    list.map(async (qr) => ({
      qr,
      scans: await scans.countByQr(qr.id),
    })),
  );

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return (
    <div className="stack" style={{ gap: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: "0 0 0.35rem" }}>Tus QRs</h1>
          <p className="muted" style={{ margin: 0 }}>
            El slug queda fijo. Editá el destino sin reimprimir.
          </p>
        </div>
        <Link className="btn secondary" href="/app/kpis">
          Ver KPIs
        </Link>
      </div>

      <div className="card-panel">
        <h2 style={{ marginTop: 0 }}>Crear QR</h2>
        <CreateQrForm action={createQrAction} />
      </div>

      <div className="stack">
        {withCounts.length === 0 ? (
          <p className="muted">Todavía no hay QRs.</p>
        ) : (
          withCounts.map(({ qr, scans: count }) => (
            <div
              key={qr.id}
              className="card-panel"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: "1rem",
                alignItems: "center",
              }}
            >
              <div>
                <h3 style={{ margin: "0 0 0.35rem" }}>{qr.title}</h3>
                <p className="muted" style={{ margin: "0 0 0.35rem" }}>
                  {appUrl}/r/{qr.slug}
                </p>
                <p style={{ margin: 0, fontSize: "0.95rem" }}>
                  Destino: {qr.destinationUrl}
                </p>
                <p className="muted" style={{ margin: "0.35rem 0 0" }}>
                  {count} escaneos · {qr.isActive ? "activo" : "pausado"}
                  {qr.campaign.label ? ` · ${qr.campaign.label}` : ""}
                </p>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <Link className="btn secondary" href={`/app/qrs/${qr.id}`}>
                  Editar
                </Link>
                <a className="btn secondary" href={`/api/qrs/${qr.id}/download?format=png`}>
                  PNG
                </a>
                <Link className="btn" href={`/app/qrs/${qr.id}/print`}>
                  Imprimir
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
