import { NextResponse } from "next/server";
import { readPriceTiers } from "@/lib/store-orders";
import { quotePosters } from "@/lib/store-pricing";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { quantity?: number } | null;
  try {
    const tiers = await readPriceTiers();
    const quote = quotePosters(Number(body?.quantity), tiers);
    if (!quote) return NextResponse.json({ error: "La cantidad no tiene un precio válido" }, { status: 400 });
    return NextResponse.json({ ...quote, payments: [] as string[] });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "No se pudieron leer los precios" }, { status: 500 });
  }
}
