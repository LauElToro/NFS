import { NextResponse } from "next/server";
import { findAccount } from "@/lib/accounts";
import { currentAccount } from "@/lib/access";
import { assignPosters } from "@/lib/qr-catalog";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const account = await currentAccount();
  if (!account || account.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const body = (await req.json()) as { resellerId?: string; ids?: string[] };
  const reseller = body.resellerId ? await findAccount(body.resellerId) : null;
  if (!reseller || reseller.role !== "reseller" || !reseller.active) {
    return NextResponse.json({ error: "Revendedor inválido" }, { status: 400 });
  }
  const ids = Array.isArray(body.ids) ? body.ids : [];
  if (ids.length === 0) return NextResponse.json({ error: "Elegí al menos un cartel" }, { status: 400 });
  const updated = await assignPosters(ids, reseller.id);
  const assigned = updated.filter((item) => item.ownerId === reseller.id && item.status === "asignado");
  return NextResponse.json({ assigned: assigned.length });
}
