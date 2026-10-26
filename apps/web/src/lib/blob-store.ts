import { createHash } from "node:crypto";
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

function fileText(key: string) {
  const file = path.join(runtimeDir(), `${key}.json`);
  if (!existsSync(file)) return null;
  return readFileSync(file, "utf8");
}

function textEtag(text: string) {
  return createHash("sha256").update(text).digest("hex");
}

export async function readStoredEntry<T>(key: string): Promise<{ value: T | null; etag: string | null }> {
  try {
    return await withStore(async (store) => {
      const reader = store as unknown as {
        getWithMetadata?: (entryKey: string, options: { type: "json" }) => Promise<{ data: T | null; etag?: string } | null>;
      };
      if (!reader.getWithMetadata) {
        const data = await store.get(key, { type: "json" });
        return { value: (data ?? null) as T | null, etag: null };
      }
      const got = await reader.getWithMetadata(key, { type: "json" });
      if (!got || got.data == null) {
        const meta = await store.getMetadata(key);
        if (meta) throw new Error(`No se pudo leer ${key}`);
        return { value: null, etag: null };
      }
      return { value: got.data, etag: got.etag || null };
    });
  } catch (error) {
    if (onNetlify()) throw error;
    const text = fileText(key);
    if (text == null) return { value: null, etag: null };
    return { value: JSON.parse(text) as T, etag: textEtag(text) };
  }
}

export async function compareAndWrite(
  key: string,
  value: unknown,
  etag: string | null,
): Promise<{ ok: true; etag: string } | { ok: false }> {
  try {
    return await withStore(async (store) => {
      const writer = store as unknown as {
        setJSON: (
          entryKey: string,
          entryValue: unknown,
          options?: { onlyIfMatch?: string; onlyIfNew?: boolean },
        ) => Promise<{ modified?: boolean; etag?: string } | void>;
      };
      const result = await writer.setJSON(key, value, etag ? { onlyIfMatch: etag } : { onlyIfNew: true });
      if (result && result.modified === false) return { ok: false };
      return { ok: true, etag: result?.etag || "written" };
    });
  } catch (error) {
    if (onNetlify()) {
      const message = error instanceof Error ? error.message : "";
      if (/precondition|etag|412|conflict|match/i.test(message)) return { ok: false };
      throw error;
    }
    const current = fileText(key);
    const currentEtag = current == null ? null : textEtag(current);
    if (currentEtag !== etag) return { ok: false };
    const text = `${JSON.stringify(value, null, 2)}\n`;
    writeFile(key, value);
    return { ok: true, etag: textEtag(text) };
  }
}
