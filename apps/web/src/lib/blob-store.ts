import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { getStore } from "@netlify/blobs";

const STORE = "nfs-qrs";
type BlobStore = ReturnType<typeof getStore>;

function onNetlify() {
  return process.env.NETLIFY === "true" || process.env.NETLIFY === "1";
}

function runtimeDir() {
  const candidates = [
    path.resolve(process.cwd(), "data", "runtime"),
    path.resolve(process.cwd(), "../../data/runtime"),
    path.resolve(process.cwd(), "../../../data/runtime"),
  ];
  return candidates.find((dir) => existsSync(path.resolve(dir, ".."))) ?? candidates[0];
}

function openStore(consistency: "strong" | "eventual"): BlobStore {
  return getStore({ name: STORE, consistency });
}

async function withStore<T>(run: (store: BlobStore) => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (const consistency of ["strong", "eventual"] as const) {
    try {
      return await run(openStore(consistency));
    } catch (error) {
      lastError = error;
    }
  }
  if (onNetlify()) {
    console.error("No se pudo usar el almacenamiento de ReviewsGO", lastError);
    throw lastError instanceof Error ? lastError : new Error("No se pudo leer el almacenamiento");
  }
  throw lastError instanceof Error ? lastError : new Error("No se pudo leer el almacenamiento");
}

function readFile<T>(key: string, fallback: T): T {
  const file = path.join(runtimeDir(), `${key}.json`);
  if (!existsSync(file)) return fallback;
  return JSON.parse(readFileSync(file, "utf8")) as T;
}

function writeFile(key: string, value: unknown) {
  const dir = runtimeDir();
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, `${key}.json`), `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export async function readStored<T>(key: string, fallback: T): Promise<T> {
  try {
    return await withStore(async (store) => {
      const data = await store.get(key, { type: "json" });
      if (data != null) return data as T;
      const meta = await store.getMetadata(key);
      if (meta) throw new Error(`No se pudo leer ${key}`);
      return fallback;
    });
  } catch (error) {
    if (onNetlify()) throw error;
    return readFile(key, fallback);
  }
}

export async function writeStored(key: string, value: unknown): Promise<void> {
  try {
    await withStore(async (store) => {
      await store.setJSON(key, value);
    });
  } catch (error) {
    if (onNetlify()) throw error;
    writeFile(key, value);
  }
}
