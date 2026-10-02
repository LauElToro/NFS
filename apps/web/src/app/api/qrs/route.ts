import { NextResponse } from "next/server";
import { readAccounts } from "@/lib/accounts";
import { currentAccount } from "@/lib/access";
import { createStock, readCatalog } from "@/lib/qr-catalog";
import type { QrItem } from "@/lib/qr-store";

export const dynamic = "force-dynamic";

async function present(items: QrItem[]) {
  const byId = new Map((await readAccounts()).map((user) => [user.id, user]));
  return items.map((item) => {
    const owner = item.ownerId ? byId.get(item.ownerId) : undefined;
    return { ...item, ownerEmail: owner?.email, ownerName: owner?.name };
  });
}

const ASSIGNED = new Set(["asignado", "enviado", "recibido"]);
const IN_USE = new Set(["configurando", "vendido", "activo"]);
const PAGE_SIZES = new Set([10, 25, 50, 100]);

function cartelOrder(item: QrItem) {
  const value = Number(String(item.cartelId || "").replace(/\D/g, ""));
  return Number.isFinite(value) ? value : 0;
}

export async function GET(req: Request) {
  const account = await currentAccount();
  if (!account) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const ownerId = url.searchParams.get("ownerId");
  let items = await readCatalog();
  if (account.role !== "admin") {
    items = items.filter((item) => item.ownerId === account.id);
  } else if (ownerId) {
    items = items.filter((item) => item.ownerId === ownerId);
  }
  const presented = await present(items);
  if (url.searchParams.get("view") !== "page" || account.role !== "admin" || ownerId) {
    return NextResponse.json(presented);
  }

  const q = (url.searchParams.get("q") || "").trim().toLowerCase();
  const group = url.searchParams.get("group") || "todos";
  const reseller = url.searchParams.get("reseller") || "";
  const commerce = (url.searchParams.get("commerce") || "").trim().toLowerCase();
  const code = (url.searchParams.get("code") || "").trim().toLowerCase();
  const sort = url.searchParams.get("sort") || "newest";
  const pageSize = PAGE_SIZES.has(Number(url.searchParams.get("pageSize")))
    ? Number(url.searchParams.get("pageSize"))
    : 25;

  let filtered = presented.filter((item) => {
    if (code) {
      const keys = [item.cartelId, item.uniqueCode, item.id, item.token].map((value) => (value || "").toLowerCase());
      return keys.includes(code);
    }
    if (group === "disponibles" || group === "sin-asignar") {
      if (item.status !== "disponible") return false;
    } else if (group === "asignados") {
      if (!ASSIGNED.has(item.status || "")) return false;
    } else if (group === "en-uso") {
      if (!IN_USE.has(item.status || "")) return false;
    } else if (group !== "todos" && item.status !== group) {
      return false;
    }
    if (reseller && item.ownerId !== reseller) return false;
    if (commerce && !(item.title || "").toLowerCase().includes(commerce)) return false;
    if (!q) return true;
    const text = [item.cartelId, item.uniqueCode, item.id, item.token, item.title, item.ownerName, item.ownerEmail, item.url]
      .join(" ")
      .toLowerCase();
    return text.includes(q);
  });

  filtered = [...filtered].sort((a, b) => {
    if (sort === "oldest") return (a.createdAt || "").localeCompare(b.createdAt || "");
    if (sort === "id-asc") return cartelOrder(a) - cartelOrder(b);
    if (sort === "id-desc") return cartelOrder(b) - cartelOrder(a);
    if (sort === "disponible-first") return Number(b.status === "disponible") - Number(a.status === "disponible");
    if (sort === "asignado-first") return Number(ASSIGNED.has(b.status || "")) - Number(ASSIGNED.has(a.status || ""));
    return (b.createdAt || "").localeCompare(a.createdAt || "");
  });

  const total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(pages, Math.max(1, Number(url.searchParams.get("page")) || 1));
  const start = (page - 1) * pageSize;
  return NextResponse.json({
    items: filtered.slice(start, start + pageSize),
    total,
    page,
    pageSize,
    availableCount: presented.filter((item) => item.status === "disponible").length,
  });
}

export async function POST(req: Request) {
  const account = await currentAccount();
  if (!account || account.role !== "admin") {
    return NextResponse.json({ error: "Los carteles los crea el administrador" }, { status: 403 });
  }
  const body = (await req.json()) as { count?: number };
  const created = await createStock(Number(body.count ?? 1));
  return NextResponse.json(await present(created));
}
