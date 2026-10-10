import { NextResponse } from "next/server";
import { currentAccount } from "@/lib/access";
import { buildTextQuery, parsePlacesResponse, placesFailure } from "@/lib/places-search";

export const dynamic = "force-dynamic";

const FIELD_MASK = "places.id,places.displayName,places.formattedAddress,places.primaryTypeDisplayName";

function placesKey() {
  return process.env.GOOGLE_PLACES_API_KEY?.trim() || "";
}

export async function GET() {
  const account = await currentAccount();
  if (!account) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  return NextResponse.json({ configured: Boolean(placesKey()) });
}

export async function POST(req: Request) {
  const account = await currentAccount();
  if (!account) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const key = placesKey();
  if (!key) {
    return NextResponse.json({
      configured: false,
      code: "unconfigured",
      error: "La búsqueda de Google no está configurada. Pegá un Place ID para generar el enlace.",
    }, { status: 503 });
  }

  const body = await req.json().catch(() => null) as { name?: unknown; area?: unknown } | null;
  const name = typeof body?.name === "string" ? body.name.trim().replace(/\s+/g, " ") : "";
  const area = typeof body?.area === "string" ? body.area.trim().replace(/\s+/g, " ") : "";
  if (name.length < 2 || name.length > 80) {
    return NextResponse.json({ error: "Escribí el nombre del negocio." }, { status: 400 });
  }
  if (area.length > 80) {
    return NextResponse.json({ error: "La ciudad o dirección es demasiado larga." }, { status: 400 });
  }

  try {
    const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": FIELD_MASK,
      },
      body: JSON.stringify({
        textQuery: buildTextQuery(name, area),
        languageCode: "es",
        regionCode: "AR",
        pageSize: 8,
      }),
      signal: AbortSignal.timeout(8000),
    });
    const payload = await res.json().catch(() => null);
    if (!res.ok) {
      console.error("places search", res.status);
      const failure = placesFailure(res.status, payload);
      const status = failure.code === "quota" ? 429 : failure.code === "denied" ? 403 : 502;
      return NextResponse.json({ ...failure, configured: true }, { status });
    }
    const parsed = parsePlacesResponse(payload);
    return NextResponse.json({ configured: true, ...parsed });
  } catch (error) {
    console.error("places search connection", error instanceof Error ? error.name : "error");
    return NextResponse.json({
      configured: true,
      code: "connection",
      error: "No se pudo conectar con Google.",
    }, { status: 502 });
  }
}
