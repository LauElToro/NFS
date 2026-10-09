import { NextResponse } from "next/server";
import { currentAccount } from "@/lib/access";
import { canManageClient, readClients, verifyPosters } from "@/lib/clients";

export const dynamic = "force-dynamic";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const account = await currentAccount();
  if (!account) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const client = (await readClients()).find((item) => item.id === id);
  if (!client || !canManageClient(account, client)) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  const body = (await req.json().catch(() => null)) as { ids?: string[] } | null;
  const ids = Array.isArray(body?.ids) ? body.ids.filter((item) => typeof item === "string") : [];
  if (ids.length === 0) return NextResponse.json({ error: "Elegí al menos un cartel" }, { status: 400 });
  const items = await verifyPosters(id, ids);
  return NextResponse.json({ checked: items.length });
}
