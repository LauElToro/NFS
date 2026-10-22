import { NextResponse } from "next/server";
import { currentAccount } from "@/lib/access";
import { deleteFolder, FolderError, getFolder, renameFolder } from "@/lib/qr-folders";

export const dynamic = "force-dynamic";

function fail(error: unknown) {
  if (error instanceof FolderError) return NextResponse.json({ error: error.message }, { status: error.status });
  console.error(error);
  return NextResponse.json({ error: "No se pudieron guardar las carpetas" }, { status: 500 });
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const account = await currentAccount();
  if (!account) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await ctx.params;
    return NextResponse.json(await getFolder(account, id));
  } catch (error) {
    return fail(error);
  }
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const account = await currentAccount();
  if (!account) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await ctx.params;
    const body = (await req.json()) as { name?: string };
    const folder = await renameFolder(account, id, body.name || "");
    return NextResponse.json({ id: folder.id, name: folder.name, updatedAt: folder.updatedAt });
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const account = await currentAccount();
  if (!account) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await ctx.params;
    await deleteFolder(account, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return fail(error);
  }
}
