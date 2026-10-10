export const FULFILLMENT = ["recibido", "preparando", "enviado", "entregado"] as const;
export type Fulfillment = (typeof FULFILLMENT)[number];

export const FULFILLMENT_LABELS: Record<Fulfillment, string> = {
  recibido: "Recibido",
  preparando: "En preparación",
  enviado: "Enviado",
  entregado: "Entregado",
};

export type DeliveryMode = "envio" | "retiro";

export type StoreOrder = {
  id: string;
  requestId: string;
  createdAt: string;
  updatedAt: string;
  buyer: { name: string; email: string; phone: string; business?: string };
  shipping: { street: string; city: string; state: string; zip: string; mode?: DeliveryMode };
  notes?: string;
  quantity: number;
  unit: number;
  total: number;
  wholesale: boolean;
  paymentStatus: "sin_medio_de_pago";
  coordination?: "pendiente";
  fulfillment: Fulfillment;
};

const REQUEST_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function text(value: unknown, min: number, max: number) {
  if (typeof value !== "string") return null;
  const clean = value.trim().replace(/\s+/g, " ");
  if (clean.length < min || clean.length > max) return null;
  return clean;
}

function loose(value: unknown, max: number) {
  if (typeof value !== "string" || value.trim() === "") return "";
  const clean = value.trim().replace(/\s+/g, " ");
  if (clean.length > max) return null;
  return clean;
}

function optionalText(value: unknown, min: number, max: number) {
  if (typeof value !== "string" || value.trim() === "") return "";
  return text(value, min, max);
}

export function parseOrderInput(body: unknown) {
  if (!body || typeof body !== "object") return null;
  const input = body as Record<string, unknown>;
  const requestId = typeof input.requestId === "string" ? input.requestId.trim() : "";
  const name = text(input.name, 2, 80);
  const phone = text(input.phone, 6, 30);
  const city = text(input.city, 2, 80);
  const state = text(input.state, 2, 80);
  const mode = input.mode === "retiro" || input.mode === "envio" ? input.mode : null;
  const business = optionalText(input.business, 2, 80);
  const email = optionalText(input.email, 5, 120);
  const zip = optionalText(input.zip, 3, 12);
  const notes = typeof input.notes === "string" ? input.notes.trim().slice(0, 500) : "";
  const street = mode === "envio" ? text(input.street, 4, 120) : loose(input.street, 120);
  const quantity = Number(input.quantity);
  if (!REQUEST_ID.test(requestId) || !name || !phone || !city || !state || !mode || street == null) return null;
  if (business == null || email == null || zip == null) return null;
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  if (!Number.isInteger(quantity)) return null;
  return {
    requestId,
    quantity,
    notes,
    buyer: { name, email, phone, business },
    shipping: { street: street || "", city, state, zip, mode },
  };
}

export function isFulfillment(value: unknown): value is Fulfillment {
  return typeof value === "string" && (FULFILLMENT as readonly string[]).includes(value);
}
