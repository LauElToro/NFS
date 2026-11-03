export const WHATSAPP_PHONE = "5491132547765";

export const FLOATING_INQUIRY =
  "Hola, ReviewsGO. Quiero consultar por los carteles NFC y QR y conocer los diseños y precios disponibles";

export type CatalogDesign = {
  id: string;
  name: string;
  description: string;
  features: string[];
};

export type PackBadge = "elegido" | "descuento" | "revendedores";

export type CatalogPack = {
  id: string;
  name: string;
  detail: string;
  quantity: number;
  unitPrice: number;
  total: number;
  wholesale: boolean;
  badge?: PackBadge;
};

export const LIST_UNIT_PRICE = 25000;

export const PACK_BADGES: Record<PackBadge, string> = {
  elegido: "Más elegido",
  descuento: "Mayor descuento",
  revendedores: "Ideal para revendedores",
};

export const DESIGNS: CatalogDesign[] = [
  {
    id: "google",
    name: "Google Reviews",
    description: "Cartel para facilitar el acceso a las reseñas del negocio.",
    features: ["NFC", "Código QR"],
  },
  {
    id: "instagram",
    name: "Instagram",
    description: "Cartel para invitar a los clientes a conocer el perfil del comercio.",
    features: ["NFC", "Código QR"],
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    description: "Cartel para facilitar el contacto con el negocio.",
    features: ["NFC", "Código QR"],
  },
];

export const PACKS: CatalogPack[] = [
  { id: "retail", name: "Compra individual", detail: "1 cartel", quantity: 1, unitPrice: 25000, total: 25000, wholesale: false },
  { id: "x3", name: "Pack x3", detail: "3 carteles", quantity: 3, unitPrice: 20000, total: 60000, wholesale: false },
  { id: "x5", name: "Pack x5", detail: "5 carteles", quantity: 5, unitPrice: 17000, total: 85000, wholesale: true },
  { id: "x10", name: "Pack x10", detail: "10 carteles", quantity: 10, unitPrice: 15000, total: 150000, wholesale: true, badge: "elegido" },
  { id: "x25", name: "Pack x25", detail: "25 carteles", quantity: 25, unitPrice: 13000, total: 325000, wholesale: true },
  { id: "x50", name: "Pack x50", detail: "50 carteles", quantity: 50, unitPrice: 11500, total: 575000, wholesale: true, badge: "revendedores" },
  { id: "x75", name: "Pack x75", detail: "75 carteles", quantity: 75, unitPrice: 11000, total: 825000, wholesale: true },
  { id: "x100", name: "Pack x100", detail: "100 carteles", quantity: 100, unitPrice: 10000, total: 1000000, wholesale: true, badge: "descuento" },
];

export function formatArs(amount: number) {
  return `$${String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
}

export function whatsappHref(message: string) {
  return `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;
}

export function designInquiry(design: CatalogDesign) {
  return `Hola, ReviewsGO. Quiero consultar por el modelo ${design.name}. ¿Me pasan más información para realizar el pedido?`;
}

export function listTotal(pack: CatalogPack) {
  return LIST_UNIT_PRICE * pack.quantity;
}

export function packSavings(pack: CatalogPack) {
  return Math.max(0, listTotal(pack) - pack.total);
}

export function packDiscountPercent(pack: CatalogPack) {
  const list = listTotal(pack);
  if (list <= 0 || pack.total >= list) return 0;
  return Math.round(((list - pack.total) / list) * 100);
}

export function packInquiry(pack: CatalogPack, units?: number) {
  const quantity = pack.quantity ?? units ?? 1;
  const total = pack.total ?? pack.unitPrice * quantity;
  const label = quantity === 1 ? "cartel" : "carteles";
  return `Hola, ReviewsGO. Quiero consultar por ${quantity} ${label}. Precio publicado: ${formatArs(total)} total, ${formatArs(pack.unitPrice)} por unidad. ¿Me pasan más información para realizar el pedido?`;
}
