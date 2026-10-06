import { NextResponse } from "next/server";
import { currentAccount } from "@/lib/access";
import { searchBusinesses } from "@/lib/places/search";
import { PlaceSearchError } from "@/lib/places/types";

export const dynamic = "force-dynamic";

const MESSAGES = {
  not_configured: "El buscador todavía no está conectado a Google Places.",
  unavailable: "Error al buscar. Probá de nuevo en unos segundos.",
  invalid: "Escribí al menos 3 caracteres.",
};

export async function GET(req: Request) {
  const account = await currentAccount();
  if (!account) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const query = new URL(req.url).searchParams.get("q") || "";
  try {
    const places = await searchBusinesses(query);
    return NextResponse.json({ places });
  } catch (error) {
    if (error instanceof PlaceSearchError) {
      const status = error.code === "invalid" ? 400 : error.code === "not_configured" ? 503 : 502;
      return NextResponse.json({ error: MESSAGES[error.code], code: error.code }, { status });
    }
    console.error(error);
    return NextResponse.json({ error: MESSAGES.unavailable, code: "unavailable" }, { status: 502 });
  }
}
