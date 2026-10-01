import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { getStore } from "@netlify/blobs";

const STORE = "nfs-qrs";
type BlobStore = ReturnType<typeof getStore>;
let blobStore: BlobStore | null | undefined;

function runtimeDir() {
  const candidates = [
    path.resolve(process.cwd(), "data", "runtime"),
    path.resolve(process.cwd(), "../../data/runtime"),
    path.resolve(process.cwd(), "../../../data/runtime"),
  ];
  return candidates.find((dir) => existsSync(path.resolve(dir, ".."))) ?? candidates[0];
}

async function blobs() {
  if (blobStore !== undefined) return blobStore;
  try {
    const store = getStore({ name: STORE, consistency: "strong" });
    await store.get("__nfs_probe", { type: "text" });
    blobStore = store;
  } catch {
    blobStore = null;
  }
  return blobStore;
}

export async function readStored<T>(key: string, fallback: T): Promise<T> {
  const store = await blobs();
  if (store) {
    const data = await store.get(key, { type: "json" });
    return (data ?? fallback) as T;
  }
  const file = path.join(runtimeDir(), `${key}.json`);
  if (!existsSync(file)) return fallback;
  return JSON.parse(readFileSync(file, "utf8")) as T;
}

export async function writeStored(key: string, value: unknown): Promise<void> {
  const store = await blobs();
  if (store) {
    await store.setJSON(key, value);
    return;
  }
  const dir = runtimeDir();
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, `${key}.json`), `${JSON.stringify(value, null, 2)}\n`, "utf8");
}
