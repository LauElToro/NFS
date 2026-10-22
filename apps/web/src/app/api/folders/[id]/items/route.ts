import { NextResponse } from "next/server";
import { currentAccount } from "@/lib/access";
import { addFolderQrs, FolderError, removeFolderQrs } from "@/lib/qr-folders";

export const dynamic = "force-dynamic";

function fail(error: unknown) {
  if (error instanceof FolderError) return NextResponse.json({ error: error.message }, { status: error.status });
  console.error(error);
  return NextResponse.json({ error: "No se pudieron guardar las carpetas" }, { status: 500 });
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const account = await currentAccount();
  if (!account) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await ctx.params;
    const body = (await req.json()) as { ids?: string[] };
    const result = await addFolderQrs(account, id, Array.isArray(body.ids) ? body.ids : []);
    return NextResponse.json(result);
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const account = await currentAccount();
  if (!account) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await ctx.params;
    const body = (await req.json()) as { ids?: string[] };
    const result = await removeFolderQrs(account, id, Array.isArray(body.ids) ? body.ids : []);
    return NextResponse.json(result);
  } catch (error) {
    return fail(error);
  }
}
