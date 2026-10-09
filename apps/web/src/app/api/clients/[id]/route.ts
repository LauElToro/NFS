import { NextResponse } from "next/server";
import { currentAccount } from "@/lib/access";
import { canManageClient, folderSummary, readClients, updateClient } from "@/lib/clients";
import { posterSetupState } from "@/lib/poster-state";
import { readCatalog } from "@/lib/qr-catalog";

export const dynamic = "force-dynamic";

const PAGE_SIZES = new Set([12, 24, 48]);

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const account = await currentAccount();
  if (!account) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const client = (await readClients()).find((item) => item.id === id);
  if (!client || !canManageClient(account, client)) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  const url = new URL(req.url);
  const query = (url.searchParams.get("q") || "").trim().toLowerCase();
  const filter = url.searchParams.get("filter") || "todos";
  const pageSize = PAGE_SIZES.has(Number(url.searchParams.get("pageSize"))) ? Number(url.searchParams.get("pageSize")) : 12;
  const catalog = await readCatalog();
  const owned = catalog.filter((item) => item.clientId === client.id);
  const available = catalog.filter((item) => {
    if (item.clientId || item.active === false || item.status === "bloqueado") return false;
    if (account.role === "admin") return item.status === "disponible";
    return item.ownerId === account.id;
  }).length;
  const filtered = owned.filter((item) => {
    const state = posterSetupState(item);
    if (filter === "pendientes" && state !== "pendiente") return false;
    if (filter === "errores" && state !== "error") return false;
    if (filter === "configurados" && state !== "funcionando") return false;
    if (!query) return true;
    return [item.cartelId, item.uniqueCode, item.id, item.token, item.url, item.title].join(" ").toLowerCase().includes(query);
  });
  const total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(pages, Math.max(1, Number(url.searchParams.get("page")) || 1));
  const start = (page - 1) * pageSize;
  const clients = (await readClients()).filter((item) => canManageClient(account, item) && item.id !== client.id);
  return NextResponse.json({
    client,
    summary: folderSummary(owned),
    available,
    others: clients.map((item) => ({ id: item.id, name: item.name })),
    items: filtered.slice(start, start + pageSize),
    total,
    page,
    pageSize,
  });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const account = await currentAccount();
  if (!account) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const current = (await readClients()).find((item) => item.id === id);
  if (!current || !canManageClient(account, current)) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  const body = (await req.json().catch(() => null)) as { name?: string; notes?: string } | null;
  try {
    const client = await updateClient(id, { name: body?.name, notes: body?.notes }, account);
    return NextResponse.json(client);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo guardar" }, { status: 400 });
  }
}
