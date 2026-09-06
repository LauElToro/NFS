import { NextRequest, NextResponse } from "next/server";
import { getContainer } from "@/lib/container";
import { getSession } from "@/lib/session";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const { qrs, qrRenderer } = getContainer();
  const qr = await qrs.findById(id);
  if (!qr || qr.ownerId !== session.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const format = req.nextUrl.searchParams.get("format") ?? "png";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const content = `${appUrl}/r/${qr.slug}`;

  if (format === "svg") {
    const svg = await qrRenderer.toSvg(content);
    return new NextResponse(svg, {
      headers: {
        "content-type": "image/svg+xml",
        "content-disposition": `attachment; filename="qr-${qr.slug}.svg"`,
      },
    });
  }

  const png = await qrRenderer.toPng(content);
  return new NextResponse(new Uint8Array(png), {
    headers: {
      "content-type": "image/png",
      "content-disposition": `attachment; filename="qr-${qr.slug}.png"`,
    },
  });
}
