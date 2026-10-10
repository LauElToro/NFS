import { NextResponse } from "next/server";
import { currentAccount } from "@/lib/access";
import { isFulfillment, readOrders, updateFulfillment } from "@/lib/store-orders";

export const dynamic = "force-dynamic";

async function admin() {
  const account = await currentAccount();
  if (!account || account.role !== "admin") return null;
  return account;
}

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await admin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await context.params;
  try {
    const order = (await readOrders()).find((item) => item.id === id);
    if (!order) return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
    return NextResponse.json(order);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "No se pudo leer el pedido" }, { status: 500 });
  }
}

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await admin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await context.params;
  const body = (await req.json().catch(() => null)) as { fulfillment?: unknown } | null;
  if (!isFulfillment(body?.fulfillment)) {
    return NextResponse.json({ error: "El estado de entrega no es válido" }, { status: 400 });
  }
  try {
    const order = await updateFulfillment(id, body.fulfillment);
    if (!order) return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
    return NextResponse.json(order);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "No se pudo actualizar el pedido" }, { status: 500 });
  }
}
