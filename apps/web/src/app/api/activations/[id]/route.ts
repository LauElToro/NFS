import { NextResponse } from "next/server";
import { currentAccount } from "@/lib/access";
import { ActivationError, annulActivation, revokeActivation } from "@/lib/activations";

export const dynamic = "force-dynamic";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const account = await currentAccount();
  if (!account || account.role !== "admin") return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  try {
    const { id } = await ctx.params;
    const body = (await req.json()) as { action?: string };
    if (body.action === "revocar") return NextResponse.json(await revokeActivation(id));
    if (body.action === "anular") return NextResponse.json(await annulActivation(id));
    return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
  } catch (error) {
    if (error instanceof ActivationError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error(error);
    return NextResponse.json({ error: "No se pudo actualizar el código" }, { status: 500 });
  }
}
