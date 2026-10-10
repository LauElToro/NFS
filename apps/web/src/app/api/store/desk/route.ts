import { NextResponse } from "next/server";
import { currentAccount } from "@/lib/access";
import { readOrders, readPriceTiers } from "@/lib/store-orders";
import { packsFromTiers } from "@/lib/store-pricing";

export const dynamic = "force-dynamic";

export async function GET() {
  const account = await currentAccount();
  if (!account) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    const tiers = await readPriceTiers();
    const packs = packsFromTiers(tiers);
    if (account.role !== "admin") {
      return NextResponse.json({ canManage: false, packs, orders: null, units: null });
    }
    return NextResponse.json({
      canManage: true,
      packs,
      units: tiers.map((tier) => tier.unit),
      orders: await readOrders(),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "No se pudo abrir la tienda" }, { status: 500 });
  }
}
