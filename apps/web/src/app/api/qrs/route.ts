import { NextResponse } from "next/server";
import { readAccounts } from "@/lib/accounts";
import { currentAccount } from "@/lib/access";
import { createStock, readCatalog } from "@/lib/qr-catalog";
import type { QrItem } from "@/lib/qr-store";

export const dynamic = "force-dynamic";

async function present(items: QrItem[]) {
  const byId = new Map((await readAccounts()).map((user) => [user.id, user]));
  return items.map((item) => {
    const owner = item.ownerId ? byId.get(item.ownerId) : undefined;
    return { ...item, ownerEmail: owner?.email, ownerName: owner?.name };
  });
}

export async function GET(req: Request) {
  const account = await currentAccount();
  if (!account) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const ownerId = new URL(req.url).searchParams.get("ownerId");
  let items = await readCatalog();
  if (account.role !== "admin") {
    items = items.filter((item) => item.ownerId === account.id);
  } else if (ownerId) {
    items = items.filter((item) => item.ownerId === ownerId);
  }
  return NextResponse.json(await present(items));
}

export async function POST(req: Request) {
  const account = await currentAccount();
  if (!account || account.role !== "admin") {
    return NextResponse.json({ error: "Los carteles los crea el administrador" }, { status: 403 });
  }
  const body = (await req.json()) as { count?: number };
  const created = await createStock(Number(body.count ?? 1));
  return NextResponse.json(await present(created));
}
