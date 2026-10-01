import { NextResponse } from "next/server";
import { createPack, readPacks, redeemPack, toPublic } from "@/lib/accounts";
import { currentAccount } from "@/lib/access";

export const dynamic = "force-dynamic";

export async function GET() {
  const account = await currentAccount();
  if (!account || account.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await readPacks());
}

export async function POST(req: Request) {
  const account = await currentAccount();
  if (!account || account.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await req.json()) as { credits?: number };
  try {
    return NextResponse.json(await createPack(Number(body.credits)));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo generar" },
      { status: 400 },
    );
  }
}

export async function PUT(req: Request) {
  const account = await currentAccount();
  if (!account || account.role !== "reseller") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await req.json()) as { code?: string };
  try {
    const result = await redeemPack(account.id, body.code ?? "");
    return NextResponse.json({ account: toPublic(result.account), credits: result.pack.credits });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo activar" },
      { status: 400 },
    );
  }
}
