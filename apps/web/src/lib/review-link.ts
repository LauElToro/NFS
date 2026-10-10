const PLACE_ID = /^[A-Za-z0-9_-]{10,255}$/;

export function parsePlaceId(value: string): string | null {
  const clean = value.trim();
  if (!clean) return null;
  try {
    const url = new URL(clean);
    const fromQuery = url.searchParams.get("placeid") || url.searchParams.get("place_id");
    if (fromQuery && PLACE_ID.test(fromQuery)) return fromQuery;
    return null;
  } catch {
    const raw = clean.startsWith("places/") ? clean.slice("places/".length) : clean;
    return PLACE_ID.test(raw) ? raw : null;
  }
}

export function reviewUrl(placeId: string): string | null {
  const id = parsePlaceId(placeId);
  if (!id) return null;
  const url = new URL("https://search.google.com/local/writereview");
  url.searchParams.set("placeid", id);
  return url.toString();
}
