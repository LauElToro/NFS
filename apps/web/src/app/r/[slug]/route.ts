import { DomainError } from "@nfs/domain";
import { NextRequest, NextResponse } from "next/server";
import { getContainer } from "@/lib/container";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params;
  try {
    const result = await getContainer().recordScanAndRedirect.execute({
      slug,
      userAgent: req.headers.get("user-agent") ?? "unknown",
      ip:
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        req.headers.get("x-real-ip") ||
        "0.0.0.0",
      acceptLanguage: req.headers.get("accept-language"),
      referer: req.headers.get("referer"),
    });
    return NextResponse.redirect(result.destinationUrl, 302);
  } catch (e) {
    if (e instanceof DomainError) {
      return new NextResponse(
        `<!doctype html><html lang="es"><body style="font-family:system-ui;background:#111;color:#eee;display:grid;place-items:center;min-height:100vh"><div><h1>QR no disponible</h1><p>${e.message}</p></div></body></html>`,
        { status: 404, headers: { "content-type": "text/html; charset=utf-8" } },
      );
    }
    throw e;
  }
}
