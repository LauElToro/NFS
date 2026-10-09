import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ConfigurePoster } from "@/components/ConfigurePoster";
import { findAccount } from "@/lib/accounts";
import { readCatalog } from "@/lib/qr-catalog";
import { displayCode } from "@/lib/poster-lookup";
import { getSession } from "@/lib/session";
import type { DestinationType } from "@/lib/qr-store";

const TYPES = new Set(["google", "instagram", "whatsapp", "facebook", "web", "otro"]);

export default async function ConfigurePosterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect(`/login?next=${encodeURIComponent(`/app/configurar/${id}`)}`);
  const account = await findAccount(session.id);
  if (!account || !account.active) redirect("/login");

  const poster = (await readCatalog()).find((item) => item.id === id);
  if (!poster) notFound();
  const allowed = account.role === "admin" || poster.ownerId === account.id;
  if (!allowed || (account.role !== "admin" && poster.status === "bloqueado")) {
    return (
      <div className="stack">
        <h1 style={{ margin: 0 }}>No podés configurar este cartel</h1>
        <p className="muted">Hace falta una cuenta con acceso a este QR.</p>
        <Link className="btn secondary" href="/app">
          Volver al panel
        </Link>
      </div>
    );
  }

  const destinationType = (TYPES.has(poster.destinationType || "") ? poster.destinationType : "google") as DestinationType;
  const slug = poster.token || poster.uniqueCode || poster.id;

  return (
    <ConfigurePoster
      id={poster.id}
      code={displayCode(poster)}
      publicPath={`/r/${slug}`}
      initialTitle={poster.title || ""}
      initialUrl={poster.url || ""}
      initialType={destinationType}
    />
  );
}
