import { NextResponse } from "next/server";
import { currentAccount } from "@/lib/access";
import { savePriceTiers } from "@/lib/store-orders";
import { packsFromTiers } from "@/lib/store-pricing";

export const dynamic = "force-dynamic";

export async function PUT(req: Request) {
  const account = await currentAccount();
  if (!account || account.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const body = (await req.json().catch(() => null)) as { units?: unknown } | null;
  try {
    const tiers = await savePriceTiers(body?.units);
    return NextResponse.json({ packs: packsFromTiers(tiers), units: tiers.map((tier) => tier.unit) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudieron guardar los precios";
    const status = message === "Los precios no son válidos" ? 400 : 500;
    console.error(error);
    return NextResponse.json({ error: message }, { status });
  }
}
