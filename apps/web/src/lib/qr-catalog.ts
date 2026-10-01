import { readStored, writeStored } from "./blob-store";
import { defaultQrs, type QrItem } from "./qr-store";

const KEY = "catalog";

export const ADMIN_USER_ID = "user-admin";

export function validQr(item: QrItem): boolean {
  if (!item.id || !item.title.trim()) return false;
  try {
    const url = new URL(item.url);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function persistable(item: QrItem): QrItem {
  return {
    id: item.id,
    title: item.title,
    url: item.url,
    ownerId: item.ownerId || ADMIN_USER_ID,
    destinationType: item.destinationType || "otro",
    active: item.active !== false,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

export async function readCatalog(): Promise<QrItem[]> {
  const data = await readStored<QrItem[] | null>(KEY, null);
  if (data == null) {
    const seed = defaultQrs().map((item) => persistable(item));
    await writeStored(KEY, seed);
    return seed;
  }
  return data.map((item) => persistable(item));
}

export async function writeCatalog(items: QrItem[]): Promise<void> {
  await writeStored(KEY, items.map((item) => persistable(item)));
}
