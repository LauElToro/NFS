import { NextResponse } from "next/server";
import { currentAccount } from "@/lib/access";
import { readCatalog, writeCatalog } from "@/lib/qr-catalog";
import type { DestinationType } from "@/lib/qr-store";

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

function canEdit(role: string, ownerId: string | undefined, actorId: string) {
  return role === "admin" || ownerId === actorId;
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const account = await currentAccount();
  if (!account) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const items = await readCatalog();
  const current = items.find((item) => item.id === id);
  if (!current || !canEdit(account.role, current.ownerId, account.id)) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const body = (await req.json()) as {
    title?: string;
    url?: string;
    destinationType?: string;
    active?: boolean;
  };
  const title = body.title?.trim() || current.title;
  const url = body.url?.trim() || current.url;
  if (!isHttpUrl(url)) return NextResponse.json({ error: "La URL no es válida" }, { status: 400 });
  const destinationType = (
    TYPES.has(body.destinationType ?? "") ? body.destinationType : current.destinationType || "otro"
  ) as DestinationType;
  const active = account.role === "admin" && typeof body.active === "boolean" ? body.active : current.active !== false;

  const next = items.map((item) =>
    item.id === id
      ? { ...item, title, url, destinationType, active, updatedAt: new Date().toISOString() }
      : item,
  );
  await writeCatalog(next);
  return NextResponse.json(next.find((item) => item.id === id));
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const account = await currentAccount();
  if (!account) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const items = await readCatalog();
  const current = items.find((item) => item.id === id);
  if (!current || !canEdit(account.role, current.ownerId, account.id)) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }
  await writeCatalog(items.filter((item) => item.id !== id));
  return NextResponse.json({ ok: true });
}
