import { NextResponse } from "next/server";
import { currentAccount } from "@/lib/access";
import { createStoreOrder, readOrders } from "@/lib/store-orders";

export const dynamic = "force-dynamic";

export async function GET() {
  const account = await currentAccount();
  if (!account || account.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    return NextResponse.json(await readOrders());
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "No se pudieron leer los pedidos" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const order = await createStoreOrder(await req.json().catch(() => null));
    return NextResponse.json({ order, payments: [] as string[] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo registrar el pedido";
    const status = message.startsWith("Revisá") || message.startsWith("La cantidad") ? 400 : 500;
    console.error(error);
    return NextResponse.json({ error: message }, { status });
  }
}
