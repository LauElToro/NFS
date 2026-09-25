import { getStore } from "@netlify/blobs";
import { defaultQrs, type QrItem } from "./qr-store";

const STORE = "nfs-qrs";
const KEY = "catalog";

function store() {
  return getStore({ name: STORE, consistency: "strong" });
}

export function validQr(item: QrItem): boolean {
  if (!item.id || !item.title.trim()) return false;
  try {
    const url = new URL(item.url);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export async function readCatalog(): Promise<QrItem[]> {
  const blobs = store();
  const data = await blobs.get(KEY, { type: "json" });
  if (data == null) {
    const seed = defaultQrs();
    await blobs.setJSON(KEY, seed);
    return seed;
  }
  return data as QrItem[];
}

export async function writeCatalog(items: QrItem[]): Promise<void> {
  await store().setJSON(KEY, items);
}
