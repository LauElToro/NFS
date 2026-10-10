import { formatArs } from "./store-pricing";

/**
 * Dirección de WhatsApp de ReviewsGO.
 * Para cambiarla, reemplazá solo este valor.
 */
export const REVIEWSGO_WHATSAPP_URL = "https://wa.link/463p24";

/**
 * El enlace corto redirige a este chat y descarta un ?text= agregado.
 * El pedido se adjunta sobre el mismo destino: +54 11 3254-7765.
 */
const REVIEWSGO_WHATSAPP_SEND = "https://api.whatsapp.com/send?phone=541132547765";

export type WhatsAppOrder = {
  id: string;
  quantity: number;
  unit: number;
  total: number;
  buyer: { name: string; business?: string; phone: string; email?: string };
  shipping: { mode?: "envio" | "retiro"; state: string; city: string; street: string; zip?: string };
  notes?: string;
};

export function buildOrderMessage(order: WhatsAppOrder) {
  const delivery = order.shipping.mode === "retiro" ? "Retiro" : "Envío a domicilio";
  return [
    "*NUEVO PEDIDO — REVIEWSGO*",
    "",
    `*Número de pedido:* ${order.id}`,
    "",
    "*DATOS DEL CLIENTE*",
    `Nombre: ${order.buyer.name}`,
    `Negocio: ${order.buyer.business?.trim() || "—"}`,
    `Teléfono: ${order.buyer.phone}`,
    `Email: ${order.buyer.email?.trim() || "—"}`,
    "",
    "*PRODUCTOS*",
    `- Carteles ReviewsGO: ${order.quantity} unidades`,
    `- Precio por unidad: ${formatArs(order.unit)}`,
    `- Subtotal: ${formatArs(order.total)}`,
    "",
    `*TOTAL DEL PEDIDO:* ${formatArs(order.total)}`,
    "",
    "*ENTREGA*",
    `Modalidad: ${delivery}`,
    `Provincia: ${order.shipping.state}`,
    `Localidad: ${order.shipping.city}`,
    `Dirección: ${order.shipping.street.trim() || "—"}`,
    `Código postal: ${order.shipping.zip?.trim() || "—"}`,
    "",
    "*NOTAS:*",
    order.notes?.trim() || "Sin observaciones.",
    "",
    "*IMPORTANTE:* Pedido pendiente de coordinación. Solicito confirmar disponibilidad, método de pago, costo de envío y plazo de entrega.",
    "",
    "¡Hola! Quiero finalizar esta compra y coordinar el pago y el envío.",
  ].join("\n");
}

export function whatsAppOrderUrl(message: string) {
  return `${REVIEWSGO_WHATSAPP_SEND}&text=${encodeURIComponent(message)}`;
}

export function isWhatsAppOrderUrl(url: string) {
  return url.startsWith(`${REVIEWSGO_WHATSAPP_SEND}&text=`);
}
