export const WHATSAPP_PHONE = "5491132547765";

export const FLOATING_INQUIRY =
  "Hola, ReviewsGO. Quiero consultar por los carteles NFC y QR y conocer los diseños y precios disponibles";

export type CatalogDesign = {
  id: string;
  name: string;
  description: string;
  features: string[];
};

export type CatalogPack = {
  id: string;
  name: string;
  detail: string;
  quantity: number | null;
  unitPrice: number;
  total: number | null;
  wholesale: boolean;
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
  {
    id: "retail",
    name: "Precio minorista",
    detail: "De 1 a 4 carteles",
    quantity: null,
    unitPrice: 25000,
    total: null,
    wholesale: false,
  },
  { id: "x5", name: "Pack x5", detail: "5 carteles", quantity: 5, unitPrice: 21000, total: 105000, wholesale: true },
  { id: "x10", name: "Pack x10", detail: "10 carteles", quantity: 10, unitPrice: 18500, total: 185000, wholesale: true },
  { id: "x20", name: "Pack x20", detail: "20 carteles", quantity: 20, unitPrice: 16500, total: 330000, wholesale: true },
  { id: "x50", name: "Pack x50", detail: "50 carteles", quantity: 50, unitPrice: 14500, total: 725000, wholesale: true },
  { id: "x75", name: "Pack x75", detail: "75 carteles", quantity: 75, unitPrice: 13500, total: 1012500, wholesale: true },
  { id: "x100", name: "Pack x100", detail: "100 carteles", quantity: 100, unitPrice: 12500, total: 1250000, wholesale: true },
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

export function packInquiry(pack: CatalogPack) {
  if (pack.total == null) {
    return `Hola, ReviewsGO. Quiero consultar por carteles de 1 a 4 unidades. Precio publicado: ${formatArs(pack.unitPrice)} por unidad. ¿Me pasan más información para realizar el pedido?`;
  }
  return `Hola, ReviewsGO. Quiero consultar por el pack de ${pack.quantity} carteles. Precio publicado: ${formatArs(pack.total)} total, ${formatArs(pack.unitPrice)} por unidad. ¿Me pasan más información para realizar el pedido?`;
}
