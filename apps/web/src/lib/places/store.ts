import { readStored, writeStored } from "../blob-store";
import { generateReviewUrl, getPlaceId } from "./review";
import type { BusinessPlace, SavedBusiness } from "./types";

const KEY = "businesses";

export async function readBusinesses(): Promise<SavedBusiness[]> {
  const data = await readStored<SavedBusiness[] | null>(KEY, []);
  return Array.isArray(data) ? data : [];
}

export async function saveBusiness(place: BusinessPlace, savedBy: string) {
  const placeId = getPlaceId(place);
  const name = place.name.trim().slice(0, 160);
  if (!name) throw new Error("Falta el nombre del negocio");
  const reviewUrl = generateReviewUrl(placeId);
  const all = await readBusinesses();
  const existing = all.find((item) => item.placeId === placeId);
  if (existing) return { business: existing, duplicate: true as const };
  const business: SavedBusiness = {
    placeId,
    name,
    address: place.address.trim().slice(0, 240),
    city: place.city.trim().slice(0, 120),
    ...(place.category?.trim() ? { category: place.category.trim().slice(0, 80) } : {}),
    reviewUrl,
    savedBy,
    savedAt: new Date().toISOString(),
  };
  await writeStored(KEY, [business, ...all]);
  return { business, duplicate: false as const };
}
