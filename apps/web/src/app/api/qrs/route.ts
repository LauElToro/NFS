import { NextResponse } from "next/server";
import { readCatalog, validQr, writeCatalog } from "@/lib/qr-catalog";
import type { QrItem } from "@/lib/qr-store";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const items = await readCatalog();
  return NextResponse.json(items);
}

export async function PUT(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as QrItem[];
  if (!Array.isArray(body) || body.some((item) => !validQr(item))) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  await writeCatalog(body);
  return NextResponse.json(body);
}
