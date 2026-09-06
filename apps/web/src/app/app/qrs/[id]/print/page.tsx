import { notFound } from "next/navigation";
import { getContainer } from "@/lib/container";
import { requireSession } from "@/lib/session";
import { PrintButton } from "@/components/PrintButton";

export default async function PrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();
  const { qrs, qrRenderer } = getContainer();
  const qr = await qrs.findById(id);
  if (!qr || qr.ownerId !== session.id) notFound();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const svg = await qrRenderer.toSvg(`${appUrl}/r/${qr.slug}`);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "2rem",
        background: "#fff",
        color: "#111",
      }}
    >
      <div style={{ textAlign: "center", maxWidth: 420 }}>
        <div dangerouslySetInnerHTML={{ __html: svg }} />
        <h1 style={{ fontFamily: "Georgia, serif", marginTop: "1rem" }}>{qr.title}</h1>
        <p style={{ color: "#555" }}>
          {appUrl}/r/{qr.slug}
        </p>
        <PrintButton />
      </div>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body, main { background: #fff !important; }
        }
      `}</style>
    </main>
  );
}
