import { NextResponse } from "next/server";
import { changeCredits, findAccount, readAccounts, toPublic } from "@/lib/accounts";
import { currentAccount } from "@/lib/access";
import { readCatalog, writeCatalog } from "@/lib/qr-catalog";
import { slugFromTitle, type DestinationType, type QrItem } from "@/lib/qr-store";

export const dynamic = "force-dynamic";

const TYPES = new Set(["google", "instagram", "whatsapp", "facebook", "web", "otro"]);

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function uniqueId(title: string, items: QrItem[]) {
  const base = slugFromTitle(title);
  let id = base;
  let n = 1;
  while (items.some((qr) => qr.id === id)) {
    n += 1;
    id = `${base}-${n}`;
  }
  return id;
}

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
  if (!account) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as { title?: string; url?: string; destinationType?: string };
  const title = body.title?.trim() ?? "";
  const url = body.url?.trim() ?? "";
  const destinationType = (TYPES.has(body.destinationType ?? "") ? body.destinationType : "otro") as DestinationType;
  if (!title) return NextResponse.json({ error: "Falta el nombre del negocio" }, { status: 400 });
  if (!isHttpUrl(url)) return NextResponse.json({ error: "La URL no es válida" }, { status: 400 });

  if (account.role === "reseller" && account.credits < 1) {
    return NextResponse.json(
      { error: "No hay créditos disponibles. Tenés que adquirir un nuevo pack." },
      { status: 402 },
    );
  }

  const billed = account.role === "reseller" ? await changeCredits(account.id, -1) : account;
  const items = await readCatalog();
  const now = new Date().toISOString();
  const item: QrItem = {
    id: uniqueId(title, items),
    title,
    url,
    ownerId: account.id,
    destinationType,
    active: true,
    createdAt: now,
    updatedAt: now,
  };
  try {
    await writeCatalog([item, ...items]);
  } catch (error) {
    if (account.role === "reseller") await changeCredits(account.id, 1);
    throw error;
  }
  const owner = await findAccount(item.ownerId || account.id);
  return NextResponse.json({
    item: { ...item, ownerEmail: owner?.email, ownerName: owner?.name },
    account: toPublic(billed),
  });
}
