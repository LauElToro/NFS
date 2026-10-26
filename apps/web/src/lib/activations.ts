export { ActivationError } from "./activation-logic";
import { randomBytes } from "node:crypto";
import { compareAndWrite, readStoredEntry } from "./blob-store";
import { createActivationPosters, readCatalog, recordDestination, writeCatalog } from "./qr-catalog";
import {
  ActivationError,
  annulCode,
  burnMissingSecret,
  completeCode,
  destinationFromInput,
  generateActivationCode,
  generateEditToken,
  fingerprint,
  lookupKey,
  normalizeCode,
  publicDestinationType,
  registerAttempt,
  reserveCode,
  revokeCode,
  sealSecret,
  secretMatches,
  PUBLIC_STATUS,
  type ActivationCode,
  type AttemptWindow,
  type CodeStatus,
} from "./activation-logic";
import type { QrItem } from "./qr-store";

const KEY = "activations";
const LIMITS_KEY = "activation-limits";

type Batch = { id: string; name: string; quantity: number; notes: string; createdAt: string };
type Store = { batches: Batch[]; codes: ActivationCode[] };
type Limits = { windows: Record<string, AttemptWindow> };

export type IssuedUnit = { cartelId: string; publicPath: string; code: string };
export type ActivationView = {
  id: string;
  cartelId: string;
  publicPath: string;
  status: CodeStatus;
  statusLabel: string;
  createdAt: string;
  activatedAt?: string;
  batchId: string;
  batchName: string;
  destinationUrl: string;
  destinationType: string;
};

function pepper() {
  const value = process.env.AUTH_SECRET;
  if (!value) throw new ActivationError("Falta AUTH_SECRET en el servidor", 500);
  return value;
}

function codeId(taken: Set<string>) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let id = "";
  do {
    const bytes = randomBytes(4);
    id = `ACT-${Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("")}`;
  } while (taken.has(id));
  return id;
}

function batchId(taken: Set<string>) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let id = "";
  do {
    const bytes = randomBytes(4);
    id = `LOTE-${Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("")}`;
  } while (taken.has(id));
  return id;
}

function emptyStore(): Store {
  return { batches: [], codes: [] };
}

function normalize(value: Store | null): Store {
  if (!value || !Array.isArray(value.codes) || !Array.isArray(value.batches)) return emptyStore();
  return value;
}

async function mutate<T>(change: (store: Store) => { store: Store; result: T }) {
  let last: unknown;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const entry = await readStoredEntry<Store>(KEY);
    const current = normalize(entry.value);
    let next: { store: Store; result: T };
    try {
      next = change(current);
    } catch (error) {
      throw error;
    }
    const wrote = await compareAndWrite(KEY, next.store, entry.etag);
    if (wrote.ok) return next.result;
    last = wrote;
  }
  console.error("No se pudo guardar la activación", last);
  throw new ActivationError("No se pudo guardar. Intentá de nuevo.", 409);
}

function replace(store: Store, code: ActivationCode) {
  return { ...store, codes: store.codes.map((item) => (item.id === code.id ? code : item)) };
}

async function guardAttempts(ipHash: string) {
  const now = Date.now();
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const entry = await readStoredEntry<Limits>(LIMITS_KEY);
    const windows = entry.value?.windows || {};
    const result = registerAttempt(windows, ipHash, now);
    if (result.blocked) throw new ActivationError("Demasiados intentos. Esperá unos minutos.", 429);
    const wrote = await compareAndWrite(LIMITS_KEY, { windows: result.windows }, entry.etag);
    if (wrote.ok) return;
  }
}

function findByLookup(store: Store, lookup: string) {
  return store.codes.find((item) => item.lookup === lookup);
}

export async function assertActivationAttempts(ip: string) {
  await guardAttempts(fingerprint(ip, pepper()));
}

export async function issueBatch(input: { quantity: number; name: string; notes: string }, origin: string) {
  const quantity = Math.floor(input.quantity);
  if (!Number.isFinite(quantity) || quantity < 1 || quantity > 100) {
    throw new ActivationError("La cantidad tiene que estar entre 1 y 100", 400);
  }
  const name = input.name.trim().slice(0, 80) || `Lote ${new Date().toLocaleDateString("es-AR")}`;
  const notes = input.notes.trim().slice(0, 300);
  const secret = pepper();
  const posters = await createActivationPosters(quantity);
  const prepared = posters.map((poster) => {
    const plain = generateActivationCode();
    const sealed = sealSecret(normalizeCode(plain));
    return {
      plain,
      poster,
      lookup: lookupKey("code", plain, secret),
      salt: sealed.salt,
      codeHash: sealed.hash,
    };
  });
  const issued: IssuedUnit[] = prepared.map((item) => ({
    cartelId: item.poster.cartelId || item.poster.id,
    publicPath: `${origin}/r/${item.poster.token || item.poster.id}`,
    code: item.plain,
  }));
  try {
    await mutate((store) => {
      const taken = new Set(store.codes.map((item) => item.id));
      const batches = new Set(store.batches.map((item) => item.id));
      const id = batchId(batches);
      const now = new Date().toISOString();
      const batch: Batch = { id, name, quantity, notes, createdAt: now };
      const records = prepared.map((item) => {
        const record: ActivationCode = {
          id: codeId(taken),
          posterId: item.poster.id,
          token: item.poster.token || item.poster.id,
          cartelId: item.poster.cartelId || item.poster.id,
          lookup: item.lookup,
          salt: item.salt,
          codeHash: item.codeHash,
          status: "pendiente",
          createdAt: now,
          batchId: id,
          events: [{ at: now, type: "creado" }],
        };
        taken.add(record.id);
        return record;
      });
      return { store: { batches: [batch, ...store.batches], codes: [...records, ...store.codes] }, result: batch };
    });
  } catch (error) {
    const ids = new Set(posters.map((item) => item.id));
    const items = await readCatalog();
    await writeCatalog(items.filter((item) => !ids.has(item.id)));
    throw error;
  }
  return { quantity, name, units: issued };
}

function view(code: ActivationCode, batches: Batch[], posters: Map<string, QrItem>): ActivationView {
  const poster = posters.get(code.posterId);
  const batch = batches.find((item) => item.id === code.batchId);
  return {
    id: code.id,
    cartelId: code.cartelId,
    publicPath: `/r/${code.token}`,
    status: code.status,
    statusLabel: PUBLIC_STATUS[code.status],
    createdAt: code.createdAt,
    activatedAt: code.activatedAt,
    batchId: code.batchId,
    batchName: batch?.name || "Sin lote",
    destinationUrl: poster?.url || "",
    destinationType: poster?.destinationType || "",
  };
}

export async function listActivations(filters: { q?: string; status?: string; batchId?: string; from?: string; to?: string }) {
  const entry = await readStoredEntry<Store>(KEY);
  const store = normalize(entry.value);
  const posters = new Map((await readCatalog()).map((item) => [item.id, item]));
  const q = (filters.q || "").trim().toLowerCase();
  const from = filters.from ? Date.parse(filters.from) : NaN;
  const to = filters.to ? Date.parse(filters.to) + 86_400_000 : NaN;
  const codes = store.codes.filter((code) => {
    if (filters.status && code.status !== filters.status && !(filters.status === "pendiente" && code.status === "reservado")) return false;
    if (filters.batchId && code.batchId !== filters.batchId) return false;
    const created = Date.parse(code.createdAt);
    if (Number.isFinite(from) && created < from) return false;
    if (Number.isFinite(to) && created > to) return false;
    if (!q) return true;
    const batch = store.batches.find((item) => item.id === code.batchId);
    return [code.cartelId, code.token, batch?.name || ""].join(" ").toLowerCase().includes(q);
  });
  return {
    batches: store.batches.map((batch) => ({ id: batch.id, name: batch.name, quantity: batch.quantity, createdAt: batch.createdAt })),
    codes: codes.map((code) => view(code, store.batches, posters)),
  };
}

export async function activationForPoster(posterId: string) {
  const entry = await readStoredEntry<Store>(KEY);
  return normalize(entry.value).codes.find((item) => item.posterId === posterId)?.status || "";
}

function matchCodeSync(store: Store, code: string) {
  const lookup = lookupKey("code", code, pepper());
  const record = findByLookup(store, lookup);
  const normalized = normalizeCode(code);
  if (!record || normalized.length !== 16 || !secretMatches(normalized, record.salt, record.codeHash)) {
    burnMissingSecret();
    throw new ActivationError("El código no es válido", 400);
  }
  return record;
}

export async function previewActivation(code: string) {
  const entry = await readStoredEntry<Store>(KEY);
  const record = matchCodeSync(normalize(entry.value), code);
  if (record.status === "activado") throw new ActivationError("Este código ya fue utilizado", 409);
  if (record.status === "revocado") throw new ActivationError("Este código fue revocado", 409);
  if (record.status === "anulado") throw new ActivationError("Este código fue anulado", 409);
  if (record.status === "reservado") throw new ActivationError("La activación está en proceso. Esperá un momento y probá de nuevo.", 409);
  return { cartelId: record.cartelId };
}

export async function activateWithCode(code: string, url: string, destinationType: string, origin: string) {
  const destination = destinationFromInput(url, destinationType);
  if (!destination) throw new ActivationError("Ingresá una URL https válida", 400);
  const type = publicDestinationType(destinationType);
  const claim = randomBytes(16).toString("hex");
  const now = new Date().toISOString();
  const reserved = await mutate((store) => {
    const record = matchCodeSync(store, code);
    const next = reserveCode(record, claim, now);
    return { store: replace(store, next), result: next };
  });
  try {
    await saveDestination(reserved.posterId, destination, type, "Activación del comprador");
  } catch (error) {
    await mutate((store) => {
      const record = store.codes.find((item) => item.id === reserved.id);
      if (!record || record.claim !== claim) return { store, result: false };
      return {
        store: replace(store, { ...record, status: "pendiente", claim: undefined, claimAt: undefined }),
        result: true,
      };
    }).catch(() => undefined);
    throw error;
  }
  const editToken = generateEditToken();
  const editSeal = sealSecret(editToken);
  const edit = { lookup: lookupKey("edit", editToken, pepper()), salt: editSeal.salt, hash: editSeal.hash };
  try {
    await mutate((store) => {
      const record = store.codes.find((item) => item.id === reserved.id);
      if (!record) throw new ActivationError("No se pudo confirmar la activación", 409);
      return { store: replace(store, completeCode(record, claim, edit, new Date().toISOString())), result: true };
    });
  } catch (error) {
    if (error instanceof ActivationError) {
      throw new ActivationError("El destino se guardó, pero la confirmación no terminó. Escaneá el cartel. Si no redirige, esperá dos minutos y volvé a ingresar el código.", 409);
    }
    throw error;
  }
  return {
    cartelId: reserved.cartelId,
    publicPath: `${origin}/r/${reserved.token}`,
    managePath: `/gestionar#${editToken}`,
  };
}

async function saveDestination(posterId: string, url: string, destinationType: QrItem["destinationType"], actorName: string) {
  const items = await readCatalog();
  const current = items.find((item) => item.id === posterId && item.channel === "activacion");
  if (!current || current.active === false) throw new ActivationError("El cartel no está disponible", 404);
  const next = recordDestination(current, url, { id: "activacion", name: actorName }, {
    destinationType,
    status: "activo",
    active: true,
    channel: "activacion",
  });
  await writeCatalog(items.map((item) => (item.id === posterId ? next : item)));
}

export async function changeWithToken(token: string, url?: string, destinationType?: string) {
  if (!token || token.length < 32) throw new ActivationError("El enlace no es válido", 400);
  const entry = await readStoredEntry<Store>(KEY);
  const store = normalize(entry.value);
  const lookup = lookupKey("edit", token, pepper());
  const record = store.codes.find((item) => item.editLookup === lookup && item.status === "activado");
  if (!record || !record.editSalt || !record.editHash || !secretMatches(token, record.editSalt, record.editHash)) {
    burnMissingSecret();
    throw new ActivationError("El enlace no es válido", 400);
  }
  const items = await readCatalog();
  const poster = items.find((item) => item.id === record.posterId);
  if (!poster) throw new ActivationError("El cartel no está disponible", 404);
  if (url === undefined) {
    return { cartelId: record.cartelId, publicPath: `/r/${record.token}`, destinationUrl: poster.url || "", destinationType: poster.destinationType || "otro" };
  }
  const destination = destinationFromInput(url, destinationType || "otro");
  if (!destination) throw new ActivationError("Ingresá una URL https válida", 400);
  await saveDestination(record.posterId, destination, publicDestinationType(destinationType || "otro"), "Edición del comprador");
  await mutate((current) => {
    const latest = current.codes.find((item) => item.id === record.id);
    if (!latest) throw new ActivationError("El cartel no está disponible", 404);
    const now = new Date().toISOString();
    const next = { ...latest, events: [{ at: now, type: "destino-actualizado" }, ...latest.events].slice(0, 20) };
    return { store: replace(current, next), result: true };
  });
  return { cartelId: record.cartelId, publicPath: `/r/${record.token}`, destinationUrl: destination, destinationType: publicDestinationType(destinationType || "otro") };
}

async function setPosterActive(posterId: string, active: boolean) {
  const items = await readCatalog();
  await writeCatalog(items.map((item) => (item.id === posterId ? { ...item, active, updatedAt: new Date().toISOString() } : item)));
}

export async function revokeActivation(id: string) {
  const now = new Date().toISOString();
  return mutate((store) => {
    const record = store.codes.find((item) => item.id === id);
    if (!record) throw new ActivationError("No encontramos ese código", 404);
    return { store: replace(store, revokeCode(record, now)), result: { id } };
  });
}

export async function annulActivation(id: string) {
  const now = new Date().toISOString();
  const result = await mutate((store) => {
    const record = store.codes.find((item) => item.id === id);
    if (!record) throw new ActivationError("No encontramos ese código", 404);
    return { store: replace(store, annulCode(record, now)), result: record.posterId };
  });
  await setPosterActive(result, false);
  return { id };
}
