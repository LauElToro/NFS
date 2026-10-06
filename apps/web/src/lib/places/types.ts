export type BusinessPlace = {
  placeId: string;
  name: string;
  address: string;
  city: string;
  category?: string;
};

export type SavedBusiness = BusinessPlace & {
  reviewUrl: string;
  savedBy: string;
  savedAt: string;
};

export type PlaceSearchCode = "not_configured" | "unavailable" | "invalid";

export class PlaceSearchError extends Error {
  constructor(readonly code: PlaceSearchCode) {
    super(code);
  }
}
