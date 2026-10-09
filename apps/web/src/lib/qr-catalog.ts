import { randomBytes, randomUUID } from "node:crypto";
import { readStored, writeStored } from "./blob-store";
import { defaultQrs, type QrItem, type UrlChange } from "./qr-store";

const KEY = "catalog";

export const ADMIN_USER_ID = "user-admin";

export function validQr(item: QrItem): boolean {
  if (!item.id) return false;
  if (!item.url) return true;
  try {
    const url = new URL(item.url);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function cartelNumber(item: QrItem) {
  const value = Number(String(item.cartelId || "").replace("CARTEL-", ""));
  return Number.isFinite(value) ? value : 0;
}

function nextCartelId(items: QrItem[]) {
  const max = items.reduce((highest, item) => Math.max(highest, cartelNumber(item)), 0);
  return `CARTEL-${String(max + 1).padStart(6, "0")}`;
}

function posterCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(6);
  return `SEB-${Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("")}`;
}

export function migratePoster(item: QrItem, cartelId: string): QrItem {
  const id = item.id;
  const url = item.url || "";
  return persistable({
    ...item,
    id,
    title: item.title || "",
    url,
    uniqueCode: item.uniqueCode || id,
    cartelId: item.cartelId || cartelId,
    status: item.status || (url ? "activo" : "disponible"),
    history: item.history || [],
    active: item.status === "bloqueado" ? false : item.active !== false,
  });
}

function persistable(item: QrItem): QrItem {
  const status = item.status;
  return {
    id: item.id,
    title: item.title || "",
    url: item.url || "",
    ownerId: item.ownerId || ADMIN_USER_ID,
    destinationType: item.destinationType || "otro",
    active: status === "bloqueado" ? false : item.active !== false,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    cartelId: item.cartelId,
    uniqueCode: item.uniqueCode || item.id,
    token: item.token,
    status,
    assignedAt: item.assignedAt,
    soldAt: item.soldAt,
    history: item.history || [],
    clientId: item.clientId,
    clientMoves: item.clientMoves || [],
    lastCheck: item.lastCheck,
  };
}

function withMigration(items: QrItem[]) {
  let max = items.reduce((highest, item) => Math.max(highest, cartelNumber(item)), 0);
  let changed = false;
  const next = items.map((item) => {
    let cartelId = item.cartelId;
    if (!cartelId) {
      max += 1;
      cartelId = `CARTEL-${String(max).padStart(6, "0")}`;
      changed = true;
    }
    if (!item.uniqueCode || !item.status || !item.history) changed = true;
    return migratePoster(item, cartelId);
  });
  return { items: next, changed };
}

export async function readCatalog(): Promise<QrItem[]> {
  const data = await readStored<QrItem[] | null>(KEY, null);
  const source = data ?? defaultQrs();
  const migrated = withMigration(source);
  if (data == null || migrated.changed) await writeStored(KEY, migrated.items);
  return migrated.items;
}

export async function createStock(count: number): Promise<QrItem[]> {
  const amount = Math.min(100, Math.max(1, Math.floor(count)));
  const items = await readCatalog();
  const created: QrItem[] = [];
  const now = new Date().toISOString();
  const taken = new Set(items.map((item) => item.id));
  for (let index = 0; index < amount; index += 1) {
    let code = posterCode();
    while (taken.has(code)) code = posterCode();
    taken.add(code);
    const poster = persistable({
      id: code,
      uniqueCode: code,
      token: randomUUID(),
      cartelId: nextCartelId([...items, ...created]),
      title: "",
      url: "",
      ownerId: ADMIN_USER_ID,
      destinationType: "google",
      status: "disponible",
      active: true,
      history: [],
      createdAt: now,
      updatedAt: now,
    });
    created.push(poster);
  }
  await writeCatalog([...created, ...items]);
  return created;
}

export async function assignPosters(ids: string[], resellerId: string): Promise<QrItem[]> {
  const items = await readCatalog();
  const wanted = new Set(ids);
  const now = new Date().toISOString();
  const next = items.map((item) => {
    if (!wanted.has(item.id)) return item;
    if (item.status === "bloqueado") return item;
    if (item.status && item.status !== "disponible") return item;
    return persistable({
      ...item,
      ownerId: resellerId,
      status: "asignado",
      assignedAt: now,
      updatedAt: now,
    });
  });
  await writeCatalog(next);
  return next.filter((item) => wanted.has(item.id));
}

export function recordDestination(
  item: QrItem,
  url: string,
  actor: { id: string; name: string },
  patch: Partial<QrItem> = {},
): QrItem {
  const history: UrlChange[] = item.history || [];
  const nextHistory =
    url !== (item.url || "")
      ? [{ at: new Date().toISOString(), from: item.url || "", to: url, byId: actor.id, byName: actor.name }, ...history]
      : history;
  return persistable({
    ...item,
    ...patch,
    id: item.id,
    uniqueCode: item.uniqueCode || item.id,
    token: item.token,
    cartelId: item.cartelId,
    url,
    history: nextHistory,
    lastCheck: url !== (item.url || "") ? undefined : item.lastCheck,
    updatedAt: new Date().toISOString(),
  });
}

export async function writeCatalog(items: QrItem[]): Promise<void> {
  await writeStored(KEY, items.map((item) => persistable(item)));
}
