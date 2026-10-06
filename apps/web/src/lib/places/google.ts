import { PlaceSearchError, type BusinessPlace } from "./types";

type GoogleComponent = { longText?: string; types?: string[] };
type GooglePlace = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  primaryTypeDisplayName?: { text?: string };
  addressComponents?: GoogleComponent[];
};

const CITY_TYPES = ["locality", "postal_town", "administrative_area_level_2", "sublocality_level_1", "administrative_area_level_1"];

function cityOf(components: GoogleComponent[] | undefined) {
  for (const type of CITY_TYPES) {
    const found = components?.find((component) => component.types?.includes(type) && component.longText);
    if (found?.longText) return found.longText;
  }
  return "";
}

export async function searchGooglePlaces(query: string, apiKey: string): Promise<BusinessPlace[]> {
  let response: Response;
  try {
    response = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask":
          "places.id,places.displayName,places.formattedAddress,places.addressComponents,places.primaryTypeDisplayName",
      },
      body: JSON.stringify({
        textQuery: query,
        languageCode: "es",
        regionCode: "AR",
        pageSize: 5,
      }),
    });
  } catch {
    throw new PlaceSearchError("unavailable");
  }

  if (!response.ok) throw new PlaceSearchError("unavailable");
  const body = (await response.json()) as { places?: GooglePlace[] };
  const places: BusinessPlace[] = [];
  for (const place of body.places ?? []) {
    const placeId = (place.id || "").trim();
    const name = (place.displayName?.text || "").trim();
    if (!/^[A-Za-z0-9_-]{10,512}$/.test(placeId) || !name) continue;
    const category = place.primaryTypeDisplayName?.text?.trim();
    places.push({
      placeId,
      name,
      address: (place.formattedAddress || "").trim(),
      city: cityOf(place.addressComponents),
      ...(category ? { category } : {}),
    });
  }
  return places.slice(0, 5);
}
