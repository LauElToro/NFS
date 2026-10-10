export const MAX_POSTERS = 100;

export type PriceTier = { upTo: number; unit: number };

export type StorePack = {
  id: string;
  name: string;
  quantity: number;
  unit: number;
  total: number | null;
  wholesale: boolean;
};

/** Una sola tarifa por cantidad. Los tramos de 20, 50, 75 y 100 ya tienen precio publicado. */
export const DEFAULT_TIERS: PriceTier[] = [
  { upTo: 4, unit: 25000 },
  { upTo: 9, unit: 21000 },
  { upTo: 19, unit: 18500 },
  { upTo: 49, unit: 16500 },
  { upTo: 74, unit: 14500 },
  { upTo: 99, unit: 13500 },
  { upTo: 100, unit: 12500 },
];

export const TIER_LABELS = [
  "De 1 a 4 carteles",
  "De 5 a 9 carteles",
  "De 10 a 19 carteles",
  "De 20 a 49 carteles",
  "De 50 a 74 carteles",
  "De 75 a 99 carteles",
  "100 carteles",
];

const PACK_QUANTITIES = [5, 10, 20, 50, 75, 100];

export function tiersFromUnits(units: unknown): PriceTier[] | null {
  if (!Array.isArray(units) || units.length !== DEFAULT_TIERS.length) return null;
  const tiers: PriceTier[] = [];
  for (let index = 0; index < DEFAULT_TIERS.length; index += 1) {
    const unit = units[index];
    if (!Number.isInteger(unit) || unit < 1 || unit > 100_000_000) return null;
    tiers.push({ upTo: DEFAULT_TIERS[index].upTo, unit });
  }
  return tiers;
}

export function unitPrice(quantity: number, tiers: PriceTier[] = DEFAULT_TIERS) {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_POSTERS) return null;
  const tier = tiers.find((item) => quantity <= item.upTo);
  return tier ? tier.unit : null;
}

export function quotePosters(quantity: number, tiers: PriceTier[] = DEFAULT_TIERS) {
  const unit = unitPrice(quantity, tiers);
  if (unit == null) return null;
  return {
    quantity,
    unit,
    total: unit * quantity,
    wholesale: quantity >= 5,
  };
}

export function packsFromTiers(tiers: PriceTier[] = DEFAULT_TIERS): StorePack[] {
  const retail = unitPrice(1, tiers);
  if (retail == null) return [];
  const packs: StorePack[] = [
    { id: "retail", name: "De 1 a 4 carteles", quantity: 1, unit: retail, total: null, wholesale: false },
  ];
  for (const quantity of PACK_QUANTITIES) {
    const unit = unitPrice(quantity, tiers);
    if (unit == null) continue;
    packs.push({
      id: `x${quantity}`,
      name: `Pack x${quantity}`,
      quantity,
      unit,
      total: unit * quantity,
      wholesale: true,
    });
  }
  return packs;
}

export const STORE_PACKS = packsFromTiers();

export function isStorePack(value: unknown): value is StorePack {
  if (!value || typeof value !== "object") return false;
  const pack = value as StorePack;
  return typeof pack.id === "string"
    && typeof pack.name === "string"
    && Number.isInteger(pack.quantity)
    && Number.isInteger(pack.unit)
    && (pack.total === null || Number.isInteger(pack.total))
    && typeof pack.wholesale === "boolean";
}

export function formatArs(value: number) {
  return `$${value.toLocaleString("es-AR")}`;
}
