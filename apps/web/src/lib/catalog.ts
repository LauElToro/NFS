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
  discount: string | null;
  featured?: boolean;
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
    name: "Pack x1 a x4",
    detail: "De 1 a 4 carteles",
    quantity: null,
    unitPrice: 25000,
    total: null,
    wholesale: false,
    discount: null,
  },
  { id: "x5", name: "Pack x5", detail: "5 carteles", quantity: 5, unitPrice: 23000, total: 115000, wholesale: true, discount: "8% OFF aprox." },
  { id: "x10", name: "Pack x10", detail: "10 carteles", quantity: 10, unitPrice: 20000, total: 200000, wholesale: true, discount: "20% OFF" },
  { id: "x25", name: "Pack x25", detail: "25 carteles", quantity: 25, unitPrice: 15000, total: 375000, wholesale: true, discount: "40% OFF" },
  { id: "x50", name: "Pack x50", detail: "50 carteles", quantity: 50, unitPrice: 12000, total: 600000, wholesale: true, discount: "52% OFF" },
  { id: "x75", name: "Pack x75", detail: "75 carteles", quantity: 75, unitPrice: 11000, total: 825000, wholesale: true, discount: "56% OFF" },
  { id: "x100", name: "Pack x100", detail: "100 carteles", quantity: 100, unitPrice: 10000, total: 1000000, wholesale: true, discount: "60% OFF", featured: true },
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

export function packInquiry(pack: CatalogPack, units?: number) {
  const quantity = pack.quantity ?? units ?? 1;
  const total = pack.total ?? pack.unitPrice * quantity;
  if (pack.quantity == null) {
    const label = quantity === 1 ? "cartel" : "carteles";
    return `Hola, ReviewsGO. Quiero consultar por ${quantity} ${label}. Precio publicado: ${formatArs(total)} total, ${formatArs(pack.unitPrice)} por unidad. ¿Me pasan más información para realizar el pedido?`;
  }
  return `Hola, ReviewsGO. Quiero consultar por el pack de ${quantity} carteles. Precio publicado: ${formatArs(total)} total, ${formatArs(pack.unitPrice)} por unidad. ¿Me pasan más información para realizar el pedido?`;
}
