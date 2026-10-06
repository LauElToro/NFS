import { searchGooglePlaces } from "./google";
import { PlaceSearchError, type BusinessPlace } from "./types";

export async function searchBusinesses(query: string): Promise<BusinessPlace[]> {
  const text = query.trim().slice(0, 120);
  if (text.length < 3) throw new PlaceSearchError("invalid");
  const apiKey = process.env.GOOGLE_PLACES_API_KEY?.trim();
  if (!apiKey) throw new PlaceSearchError("not_configured");
  return searchGooglePlaces(text, apiKey);
}
