export const MAX_POSTERS = 100;

export type StorePack = {
  id: string;
  name: string;
  quantity: number;
  unit: number;
  total: number | null;
  wholesale: boolean;
};

export const STORE_PACKS: StorePack[] = [
  { id: "retail", name: "De 1 a 4 carteles", quantity: 1, unit: 25000, total: null, wholesale: false },
  { id: "x5", name: "Pack x5", quantity: 5, unit: 21000, total: 105000, wholesale: true },
  { id: "x10", name: "Pack x10", quantity: 10, unit: 18500, total: 185000, wholesale: true },
  { id: "x20", name: "Pack x20", quantity: 20, unit: 16500, total: 330000, wholesale: true },
  { id: "x50", name: "Pack x50", quantity: 50, unit: 14500, total: 725000, wholesale: true },
  { id: "x75", name: "Pack x75", quantity: 75, unit: 13500, total: 1012500, wholesale: true },
  { id: "x100", name: "Pack x100", quantity: 100, unit: 12500, total: 1250000, wholesale: true },
];

export function unitPrice(quantity: number) {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_POSTERS) return null;
  if (quantity <= 4) return 25000;
  if (quantity < 10) return 21000;
  if (quantity < 20) return 18500;
  if (quantity < 50) return 16500;
  if (quantity < 75) return 14500;
  if (quantity < 100) return 13500;
  return 12500;
}

export function quotePosters(quantity: number) {
  const unit = unitPrice(quantity);
  if (unit == null) return null;
  return {
    quantity,
    unit,
    total: unit * quantity,
    wholesale: quantity >= 5,
  };
}

export function formatArs(value: number) {
  return `$${value.toLocaleString("es-AR")}`;
}
