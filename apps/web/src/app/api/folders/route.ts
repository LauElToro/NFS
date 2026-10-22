import { NextResponse } from "next/server";
import { currentAccount } from "@/lib/access";
import { createFolder, FolderError, listFolders } from "@/lib/qr-folders";

export const dynamic = "force-dynamic";

function fail(error: unknown) {
  if (error instanceof FolderError) return NextResponse.json({ error: error.message }, { status: error.status });
  console.error(error);
  return NextResponse.json({ error: "No se pudieron guardar las carpetas" }, { status: 500 });
}

export async function GET(req: Request) {
  const account = await currentAccount();
  if (!account) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const query = new URL(req.url).searchParams.get("q") || "";
    return NextResponse.json(await listFolders(account, query));
  } catch (error) {
    return fail(error);
  }
}

export async function POST(req: Request) {
  const account = await currentAccount();
  if (!account) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = (await req.json()) as { name?: string; qrIds?: string[] };
    const created = await createFolder(account, body.name || "", Array.isArray(body.qrIds) ? body.qrIds : []);
    return NextResponse.json(created);
  } catch (error) {
    return fail(error);
  }
}
