import { NextResponse } from "next/server";
import { readCatalog } from "@/lib/qr-catalog";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params;
  const qr = (await readCatalog()).find((item) => item.id === slug);
  if (!qr) {
    return new NextResponse(
      `<!doctype html><html lang="es"><body style="font-family:system-ui;background:#111;color:#eee;display:grid;place-items:center;min-height:100vh"><div><h1>QR no disponible</h1><p>Este código fue eliminado o no existe.</p></div></body></html>`,
      { status: 404, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } },
    );
  }

  return NextResponse.redirect(qr.url, {
    status: 302,
    headers: { "cache-control": "no-store" },
  });
}
