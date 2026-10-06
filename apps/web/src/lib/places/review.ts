import type { BusinessPlace } from "./types";

const PLACE_ID = /^[A-Za-z0-9_-]{10,512}$/;
const REVIEW_PREFIX = "https://search.google.com/local/writereview?placeid=";

export function assertPlaceId(value: string) {
  const placeId = value.trim();
  if (!PLACE_ID.test(placeId)) throw new Error("Place ID inválido");
  return placeId;
}

export function getPlaceId(place: Pick<BusinessPlace, "placeId">) {
  return assertPlaceId(place.placeId);
}

export function generateReviewUrl(placeId: string) {
  return `${REVIEW_PREFIX}${encodeURIComponent(assertPlaceId(placeId))}`;
}

export function isReviewUrl(value: string) {
  if (!value.startsWith(REVIEW_PREFIX)) return false;
  try {
    assertPlaceId(decodeURIComponent(value.slice(REVIEW_PREFIX.length)));
    return true;
  } catch {
    return false;
  }
}
