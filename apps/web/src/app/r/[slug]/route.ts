import { NextResponse } from "next/server";
import { activationForPoster } from "@/lib/activations";
import { readCatalog } from "@/lib/qr-catalog";
import { displayCode, findByPublicSlug } from "@/lib/poster-lookup";
import { unconfiguredPosterHtml } from "@/lib/unconfigured-page";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params;
  const qr = findByPublicSlug(await readCatalog(), slug);
  if (!qr || qr.active === false || qr.status === "bloqueado") {
    return new NextResponse(
      `<!doctype html><html lang="es"><body style="font-family:system-ui;background:#111;color:#eee;display:grid;place-items:center;min-height:100vh"><div><h1>QR no disponible</h1><p>Este código fue eliminado o no existe.</p></div></body></html>`,
      { status: 404, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } },
    );
  }

  if (!qr.url) {
    let kind: "panel" | "compra" | "cerrado" | "listo" = qr.channel === "activacion" ? "compra" : "panel";
    if (qr.channel === "activacion") {
      try {
        const state = await activationForPoster(qr.id);
        if (state === "revocado" || state === "anulado") kind = "cerrado";
        else if (state === "activado") kind = "listo";
      } catch (error) {
        console.error(error);
      }
    }
    return new NextResponse(unconfiguredPosterHtml(displayCode(qr), qr.id, kind), {
      status: 200,
      headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
    });
  }

  let target = qr.url;
  try {
    const parsed = new URL(qr.url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") target = "";
  } catch {
    target = "";
  }
  if (!target) {
    return new NextResponse(unconfiguredPosterHtml(displayCode(qr), qr.id, qr.channel === "activacion" ? "listo" : "panel"), {
      status: 200,
      headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
    });
  }

  return NextResponse.redirect(target, {
    status: 302,
    headers: { "cache-control": "no-store" },
  });
}
