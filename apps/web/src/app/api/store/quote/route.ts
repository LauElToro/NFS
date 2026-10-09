import { NextResponse } from "next/server";
import { quotePosters } from "@/lib/store-pricing";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { quantity?: number } | null;
  const quote = quotePosters(Number(body?.quantity));
  if (!quote) return NextResponse.json({ error: "La cantidad no tiene un precio válido" }, { status: 400 });
  return NextResponse.json({ ...quote, payments: [] as string[] });
}
