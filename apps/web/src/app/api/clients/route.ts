import { NextResponse } from "next/server";
import { currentAccount } from "@/lib/access";
import { createClient, folderSummary, readClients } from "@/lib/clients";
import { readCatalog } from "@/lib/qr-catalog";
import type { QrItem } from "@/lib/qr-store";

export const dynamic = "force-dynamic";

const PAGE_SIZES = new Set([12, 24, 48]);

function matchesQuery(clientName: string, clientId: string, posters: QrItem[], query: string) {
  if (!query) return true;
  const haystack = [clientName, clientId, ...posters.flatMap((item) => [item.cartelId, item.uniqueCode, item.id, item.token])]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

export async function GET(req: Request) {
  const account = await currentAccount();
  if (!account) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const query = (url.searchParams.get("q") || "").trim().toLowerCase();
  const filter = url.searchParams.get("filter") || "todos";
  const sort = url.searchParams.get("sort") || "newest";
  const pageSize = PAGE_SIZES.has(Number(url.searchParams.get("pageSize"))) ? Number(url.searchParams.get("pageSize")) : 12;
  const clients = (await readClients()).filter((client) => account.role === "admin" || client.ownerId === account.id);
  const posters = await readCatalog();
  const rows = clients
    .map((client) => {
      const owned = posters.filter((item) => item.clientId === client.id);
      return { client, posters: owned, summary: folderSummary(owned) };
    })
    .filter((row) => matchesQuery(row.client.name, row.client.id, row.posters, query))
    .filter((row) => {
      if (filter === "pendientes") return row.summary.pendientes > 0;
      if (filter === "errores") return row.summary.errores > 0;
      if (filter === "configurados") return row.summary.total > 0 && row.summary.configurados === row.summary.total;
      return true;
    })
    .sort((a, b) => {
      if (sort === "oldest") return a.client.createdAt.localeCompare(b.client.createdAt);
      if (sort === "count-desc") return b.summary.total - a.summary.total;
      if (sort === "count-asc") return a.summary.total - b.summary.total;
      return b.client.createdAt.localeCompare(a.client.createdAt);
    });
  const total = rows.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(pages, Math.max(1, Number(url.searchParams.get("page")) || 1));
  const start = (page - 1) * pageSize;
  return NextResponse.json({
    items: rows.slice(start, start + pageSize).map((row) => ({
      id: row.client.id,
      name: row.client.name,
      notes: row.client.notes,
      createdAt: row.client.createdAt,
      ...row.summary,
    })),
    total,
    page,
    pageSize,
  });
}

export async function POST(req: Request) {
  const account = await currentAccount();
  if (!account) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await req.json().catch(() => null)) as { name?: string; notes?: string } | null;
  try {
    const client = await createClient(body?.name || "", body?.notes || "", account);
    return NextResponse.json(client);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo crear" }, { status: 400 });
  }
}
