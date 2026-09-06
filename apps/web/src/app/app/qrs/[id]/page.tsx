import Link from "next/link";
import { notFound } from "next/navigation";
import { updateQrAction } from "@/app/actions";
import { UpdateQrForm } from "@/components/UpdateQrForm";
import { getContainer } from "@/lib/container";
import { requireSession } from "@/lib/session";

export default async function QrDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();
  const qr = await getContainer().qrs.findById(id);
  if (!qr || qr.ownerId !== session.id) notFound();

  const scanCount = await getContainer().scans.countByQr(qr.id);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return (
    <div className="stack">
      <Link className="muted" href="/app">
        ← Volver
      </Link>
      <h1 style={{ margin: 0 }}>{qr.title}</h1>
      <p className="muted" style={{ margin: 0 }}>
        {appUrl}/r/{qr.slug} · {scanCount} escaneos
      </p>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <a className="btn secondary" href={`/api/qrs/${qr.id}/download?format=png`}>
          Descargar PNG
        </a>
        <a className="btn secondary" href={`/api/qrs/${qr.id}/download?format=svg`}>
          Descargar SVG
        </a>
        <Link className="btn" href={`/app/qrs/${qr.id}/print`}>
          Imprimir
        </Link>
      </div>
      <div className="card-panel">
        <h2 style={{ marginTop: 0 }}>Editar (sin regenerar el QR físico)</h2>
        <UpdateQrForm
          action={updateQrAction}
          initial={{
            id: qr.id,
            title: qr.title,
            destinationUrl: qr.destinationUrl,
            isActive: qr.isActive,
            campaignLabel: qr.campaign.label ?? "",
          }}
        />
      </div>
    </div>
  );
}
