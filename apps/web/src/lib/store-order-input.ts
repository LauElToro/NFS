export const FULFILLMENT = ["recibido", "preparando", "enviado", "entregado"] as const;
export type Fulfillment = (typeof FULFILLMENT)[number];

export const FULFILLMENT_LABELS: Record<Fulfillment, string> = {
  recibido: "Recibido",
  preparando: "En preparación",
  enviado: "Enviado",
  entregado: "Entregado",
};

export type StoreOrder = {
  id: string;
  requestId: string;
  createdAt: string;
  updatedAt: string;
  buyer: { name: string; email: string; phone: string };
  shipping: { street: string; city: string; state: string; zip: string };
  quantity: number;
  unit: number;
  total: number;
  wholesale: boolean;
  paymentStatus: "sin_medio_de_pago";
  fulfillment: Fulfillment;
};

const REQUEST_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function text(value: unknown, min: number, max: number) {
  if (typeof value !== "string") return null;
  const clean = value.trim().replace(/\s+/g, " ");
  if (clean.length < min || clean.length > max) return null;
  return clean;
}

export function parseOrderInput(body: unknown) {
  if (!body || typeof body !== "object") return null;
  const input = body as Record<string, unknown>;
  const requestId = typeof input.requestId === "string" ? input.requestId.trim() : "";
  const name = text(input.name, 2, 80);
  const email = text(input.email, 5, 120);
  const phone = text(input.phone, 6, 30);
  const street = text(input.street, 4, 120);
  const city = text(input.city, 2, 80);
  const state = text(input.state, 2, 80);
  const zip = text(input.zip, 3, 12);
  const quantity = Number(input.quantity);
  if (!REQUEST_ID.test(requestId) || !name || !email || !phone || !street || !city || !state || !zip) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  if (!Number.isInteger(quantity)) return null;
  return {
    requestId,
    quantity,
    buyer: { name, email, phone },
    shipping: { street, city, state, zip },
  };
}

export function isFulfillment(value: unknown): value is Fulfillment {
  return typeof value === "string" && (FULFILLMENT as readonly string[]).includes(value);
}
