import { NextResponse } from "next/server";
import { toPublic, updateReseller } from "@/lib/accounts";
import { currentAccount } from "@/lib/access";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const account = await currentAccount();
  if (!account || account.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const body = (await req.json()) as {
    name?: string;
    active?: boolean;
    creditsDelta?: number;
    password?: string;
  };
  try {
    const updated = await updateReseller(id, {
      name: body.name,
      active: body.active,
      creditsDelta: body.creditsDelta === undefined ? undefined : Number(body.creditsDelta),
      password: body.password?.trim() || undefined,
    });
    return NextResponse.json(toPublic(updated));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo actualizar" },
      { status: 400 },
    );
  }
}
