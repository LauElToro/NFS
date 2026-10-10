import { NextResponse } from "next/server";
import { readPriceTiers } from "@/lib/store-orders";
import { packsFromTiers } from "@/lib/store-pricing";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const tiers = await readPriceTiers();
    return NextResponse.json({ packs: packsFromTiers(tiers), payments: [] as string[] });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "No se pudieron leer los precios" }, { status: 500 });
  }
}
