import { NextResponse } from "next/server";
import { currentAccount } from "@/lib/access";
import { assignStockToClient, canManageClient, readClients } from "@/lib/clients";

export const dynamic = "force-dynamic";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const account = await currentAccount();
  if (!account) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const client = (await readClients()).find((item) => item.id === id);
  if (!client || !canManageClient(account, client)) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  const body = (await req.json().catch(() => null)) as { count?: number } | null;
  const result = await assignStockToClient(id, Number(body?.count ?? 1), account);
  if (!result) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json({ assigned: result.assigned.length, available: result.available });
}
