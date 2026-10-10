import { parsePlaceId } from "./review-link";

export type PlaceHit = {
  id: string;
  name: string;
  address: string;
  kind: string;
};

export type PlacesFailure = {
  code: "quota" | "denied" | "invalid" | "google";
  error: string;
};

export function buildTextQuery(name: string, area: string) {
  return area ? `${name} ${area}` : name;
}

export function parsePlacesResponse(body: unknown): { places: PlaceHit[]; skipped: number } {
  const list = body && typeof body === "object" && Array.isArray((body as { places?: unknown }).places)
    ? (body as { places: unknown[] }).places
    : [];
  const seen = new Set<string>();
  const places: PlaceHit[] = [];
  let skipped = 0;
  for (const item of list) {
    if (!item || typeof item !== "object") {
      skipped += 1;
      continue;
    }
    const raw = item as {
      id?: unknown;
      name?: unknown;
      displayName?: { text?: unknown };
      formattedAddress?: unknown;
      primaryTypeDisplayName?: { text?: unknown };
    };
    const fromId = typeof raw.id === "string" ? parsePlaceId(raw.id) : null;
    const fromName = typeof raw.name === "string" ? parsePlaceId(raw.name) : null;
    const id = fromId || fromName;
    const name = typeof raw.displayName?.text === "string" ? raw.displayName.text.trim() : "";
    if (!id || !name || seen.has(id)) {
      skipped += 1;
      continue;
    }
    seen.add(id);
    places.push({
      id,
      name,
      address: typeof raw.formattedAddress === "string" ? raw.formattedAddress : "",
      kind: typeof raw.primaryTypeDisplayName?.text === "string" ? raw.primaryTypeDisplayName.text : "",
    });
  }
  return { places, skipped };
}

export function placesFailure(status: number, body: unknown): PlacesFailure {
  const googleStatus = body && typeof body === "object"
    ? String((body as { error?: { status?: string } }).error?.status || "")
    : "";
  if (status === 429 || googleStatus === "RESOURCE_EXHAUSTED") {
    return { code: "quota", error: "Google alcanzó la cuota de Places. Podés pegar un Place ID mientras tanto." };
  }
  if (status === 403 || googleStatus === "PERMISSION_DENIED" || googleStatus === "UNAUTHENTICATED" || googleStatus === "API_KEY_INVALID") {
    return { code: "denied", error: "La clave no tiene habilitada Places API (New) o no es válida." };
  }
  if (status === 400) {
    return { code: "invalid", error: "Google no aceptó la búsqueda. Revisá el nombre del negocio." };
  }
  return { code: "google", error: "Google no pudo completar la búsqueda." };
}
