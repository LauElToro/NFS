import { NextResponse } from "next/server";
import { readCatalog } from "@/lib/qr-catalog";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params;
  const qr = (await readCatalog()).find((item) =>
    item.token ? item.token === slug : item.id === slug || item.uniqueCode === slug,
  );
  if (!qr || qr.active === false || qr.status === "bloqueado") {
    return new NextResponse(
      `<!doctype html><html lang="es"><body style="font-family:system-ui;background:#111;color:#eee;display:grid;place-items:center;min-height:100vh"><div><h1>QR no disponible</h1><p>Este código fue eliminado o no existe.</p></div></body></html>`,
      { status: 404, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } },
    );
  }

  if (!qr.url) {
    return new NextResponse(
      `<!doctype html><html lang="es"><body style="font-family:system-ui;background:#111;color:#eee;display:grid;place-items:center;min-height:100vh"><div><h1>Cartel sin destino</h1><p>Este cartel todavía no fue configurado.</p></div></body></html>`,
      { status: 404, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } },
    );
  }

  return NextResponse.redirect(qr.url, {
    status: 302,
    headers: { "cache-control": "no-store" },
  });
}
