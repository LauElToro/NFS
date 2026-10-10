import { randomBytes } from "node:crypto";
import { readStored, writeStored } from "./blob-store";
import { parseOrderInput, type Fulfillment, type StoreOrder } from "./store-order-input";
import { DEFAULT_TIERS, quotePosters, tiersFromUnits, type PriceTier } from "./store-pricing";

const PRICES_KEY = "store-prices";
const ORDERS_KEY = "store-orders";

export type { Fulfillment, StoreOrder };
export { FULFILLMENT, FULFILLMENT_LABELS, isFulfillment, parseOrderInput } from "./store-order-input";

export async function readPriceTiers(): Promise<PriceTier[]> {
  const stored = await readStored<{ units?: unknown } | null>(PRICES_KEY, null);
  if (stored == null) return DEFAULT_TIERS;
  const tiers = tiersFromUnits(stored.units);
  if (!tiers) throw new Error("Precios de la tienda inválidos");
  return tiers;
}

export async function savePriceTiers(units: unknown) {
  const tiers = tiersFromUnits(units);
  if (!tiers) throw new Error("Los precios no son válidos");
  await writeStored(PRICES_KEY, { units: tiers.map((tier) => tier.unit) });
  return tiers;
}

export async function readOrders() {
  const data = await readStored<StoreOrder[] | null>(ORDERS_KEY, []);
  return Array.isArray(data) ? data : [];
}

function orderCode(taken: Set<string>) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const day = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date()).replace(/-/g, "");
  let code = "";
  do {
    const bytes = randomBytes(4);
    const suffix = Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
    code = `RG-${day}-${suffix}`;
  } while (taken.has(code));
  return code;
}

export async function createStoreOrder(body: unknown) {
  const input = parseOrderInput(body);
  if (!input) throw new Error("Revisá los datos del comprador y la dirección");
  const orders = await readOrders();
  const existing = orders.find((order) => order.requestId === input.requestId);
  if (existing && existing.coordination !== "pendiente") return existing;
  const quote = quotePosters(input.quantity, await readPriceTiers());
  if (!quote) throw new Error("La cantidad no tiene un precio válido");
  const now = new Date().toISOString();
  const order: StoreOrder = {
    id: existing?.id || orderCode(new Set(orders.map((item) => item.id))),
    requestId: input.requestId,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    buyer: input.buyer,
    shipping: input.shipping,
    notes: input.notes,
    quantity: quote.quantity,
    unit: quote.unit,
    total: quote.total,
    wholesale: quote.wholesale,
    paymentStatus: "sin_medio_de_pago",
    coordination: "pendiente",
    fulfillment: existing?.fulfillment || "recibido",
  };
  const next = existing
    ? orders.map((item) => item.requestId === input.requestId ? order : item)
    : [order, ...orders];
  await writeStored(ORDERS_KEY, next);
  return order;
}

export async function updateFulfillment(id: string, fulfillment: Fulfillment) {
  const orders = await readOrders();
  const index = orders.findIndex((order) => order.id === id);
  if (index < 0) return null;
  const next = { ...orders[index], fulfillment, updatedAt: new Date().toISOString() };
  orders[index] = next;
  await writeStored(ORDERS_KEY, orders);
  return next;
}
