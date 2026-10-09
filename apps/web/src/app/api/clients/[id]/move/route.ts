import { NextResponse } from "next/server";
import { currentAccount } from "@/lib/access";
import { canManageClient, movePosters, readClients } from "@/lib/clients";

export const dynamic = "force-dynamic";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const account = await currentAccount();
  if (!account) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const clients = await readClients();
  const source = clients.find((item) => item.id === id);
  const body = (await req.json().catch(() => null)) as { targetId?: string; ids?: string[] } | null;
  const target = clients.find((item) => item.id === body?.targetId);
  if (!source || !target || !canManageClient(account, source) || !canManageClient(account, target)) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }
  const ids = Array.isArray(body?.ids) ? body.ids : [];
  if (ids.length === 0) return NextResponse.json({ error: "Elegí al menos un cartel" }, { status: 400 });
  const result = await movePosters(source.id, target.id, ids, account);
  return NextResponse.json({ moved: result?.moved ?? 0 });
}
