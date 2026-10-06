import { NextResponse } from "next/server";
import { currentAccount } from "@/lib/access";
import { readBusinesses, saveBusiness } from "@/lib/places/store";
import type { BusinessPlace } from "@/lib/places/types";

export const dynamic = "force-dynamic";

function publicBusiness(item: Awaited<ReturnType<typeof readBusinesses>>[number]) {
  const { savedBy: _savedBy, ...rest } = item;
  return rest;
}

export async function GET() {
  const account = await currentAccount();
  if (!account) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const items = await readBusinesses();
  const visible = account.role === "admin" ? items : items.filter((item) => item.savedBy === account.id);
  return NextResponse.json(visible.map(publicBusiness));
}

export async function POST(req: Request) {
  const account = await currentAccount();
  if (!account) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await req.json().catch(() => null)) as Partial<BusinessPlace> | null;
  if (!body?.placeId || !body.name) {
    return NextResponse.json({ error: "Elegí un negocio con Place ID" }, { status: 400 });
  }
  try {
    const result = await saveBusiness(
      {
        placeId: body.placeId,
        name: body.name,
        address: body.address || "",
        city: body.city || "",
        category: body.category,
      },
      account.id,
    );
    return NextResponse.json({ business: publicBusiness(result.business), duplicate: result.duplicate });
  } catch {
    return NextResponse.json({ error: "No se puede guardar un negocio sin Place ID válido" }, { status: 400 });
  }
}
