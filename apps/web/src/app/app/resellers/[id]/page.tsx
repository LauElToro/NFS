import Link from "next/link";
import { QrBoard } from "@/components/QrBoard";

export default async function ResellerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="stack">
      <Link className="muted" href="/app/resellers">
        ← Revendedores
      </Link>
      <QrBoard ownerId={id} />
    </div>
  );
}
