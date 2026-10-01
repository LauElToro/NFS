import { NextResponse } from "next/server";
import { currentAccount } from "@/lib/access";
import { ADMIN_USER_ID, readCatalog, recordDestination, writeCatalog } from "@/lib/qr-catalog";
import { POSTER_STATUSES, type DestinationType, type PosterStatus } from "@/lib/qr-store";

export const dynamic = "force-dynamic";

const TYPES = new Set(["google", "instagram", "whatsapp", "facebook", "web", "otro"]);

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const account = await currentAccount();
  if (!account) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const items = await readCatalog();
  const current = items.find((item) => item.id === id);
  const owns = account.role === "admin" || current?.ownerId === account.id;
  if (!current || !owns) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  if (account.role !== "admin" && current.status === "bloqueado") {
    return NextResponse.json({ error: "Este cartel está bloqueado" }, { status: 403 });
  }

  const body = (await req.json()) as {
    title?: string;
    url?: string;
    destinationType?: string;
    status?: string;
    sale?: boolean;
    restoreUrl?: string;
  };

  let next = current;
  const destinationType = (
    TYPES.has(body.destinationType ?? "") ? body.destinationType : current.destinationType || "otro"
  ) as DestinationType;
  const title = body.title !== undefined ? body.title.trim() : current.title;

  if (body.restoreUrl !== undefined) {
    if (account.role !== "admin") return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    if (body.restoreUrl && !isHttpUrl(body.restoreUrl)) {
      return NextResponse.json({ error: "La URL no es válida" }, { status: 400 });
    }
    next = recordDestination(next, body.restoreUrl, account, { title, destinationType });
  } else if (body.url !== undefined) {
    const url = body.url.trim();
    if (!isHttpUrl(url)) return NextResponse.json({ error: "La URL no es válida" }, { status: 400 });
    const status =
      account.role !== "admin" && !["vendido", "activo", "bloqueado"].includes(current.status || "")
        ? "configurando"
        : current.status;
    next = recordDestination(next, url, account, { title, destinationType, status });
  } else {
    next = { ...next, title, destinationType, updatedAt: new Date().toISOString() };
  }

  if (body.sale && account.role !== "admin") {
    if (!next.url) return NextResponse.json({ error: "Primero configurá la URL de destino" }, { status: 400 });
    if (!next.title.trim()) return NextResponse.json({ error: "Falta el nombre del comercio" }, { status: 400 });
    next = { ...next, status: "vendido", soldAt: new Date().toISOString() };
  }

  if (account.role === "admin" && body.status && POSTER_STATUSES.includes(body.status as PosterStatus)) {
    const status = body.status as PosterStatus;
    next = {
      ...next,
      status,
      active: status !== "bloqueado",
      ownerId: status === "disponible" ? ADMIN_USER_ID : next.ownerId,
      assignedAt: status === "disponible" ? undefined : next.assignedAt,
    };
  }

  next = {
    ...next,
    id: current.id,
    uniqueCode: current.uniqueCode || current.id,
    cartelId: current.cartelId,
    token: current.token,
  };
  const saved = items.map((item) => (item.id === id ? next : item));
  await writeCatalog(saved);
  return NextResponse.json(next);
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const account = await currentAccount();
  if (!account || account.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const items = await readCatalog();
  if (!items.some((item) => item.id === id)) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  await writeCatalog(items.filter((item) => item.id !== id));
  return NextResponse.json({ ok: true });
}
