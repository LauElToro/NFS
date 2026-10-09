import { randomBytes } from "node:crypto";
import { readStored, writeStored } from "./blob-store";
import type { Account } from "./accounts";
import { readCatalog, writeCatalog } from "./qr-catalog";
import { posterSetupState } from "./poster-state";
import type { ClientMove, QrItem } from "./qr-store";

const KEY = "clients";

export type FolderChange = {
  at: string;
  byId: string;
  byName: string;
  change: string;
};

export type ClientFolder = {
  id: string;
  name: string;
  notes: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  history: FolderChange[];
};

export function canManageClient(account: Pick<Account, "id" | "role">, client: Pick<ClientFolder, "ownerId">) {
  return account.role === "admin" || client.ownerId === account.id;
}

export function folderSummary(posters: QrItem[]) {
  const counts = { total: posters.length, configurados: 0, pendientes: 0, errores: 0, sinVerificar: 0 };
  for (const poster of posters) {
    const state = posterSetupState(poster);
    if (state === "funcionando") counts.configurados += 1;
    else if (state === "pendiente") counts.pendientes += 1;
    else if (state === "error") counts.errores += 1;
    else counts.sinVerificar += 1;
  }
  const status =
    counts.total === 0
      ? "Sin carteles"
      : counts.errores > 0
        ? "Con errores"
        : counts.pendientes > 0
          ? "Pendiente"
          : counts.sinVerificar > 0
            ? "Sin verificar"
            : "Configurado";
  return { ...counts, status };
}

function clientCode(taken: Set<string>) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  do {
    const bytes = randomBytes(4);
    code = `CLI-${Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("")}`;
  } while (taken.has(code));
  return code;
}

export async function readClients(): Promise<ClientFolder[]> {
  const data = await readStored<ClientFolder[] | null>(KEY, []);
  return Array.isArray(data) ? data : [];
}

async function writeClients(clients: ClientFolder[]) {
  await writeStored(KEY, clients);
}

export async function createClient(name: string, notes: string, actor: { id: string; name: string }) {
  const cleanName = name.trim().slice(0, 80);
  if (!cleanName) throw new Error("Falta el nombre del negocio");
  const clients = await readClients();
  const now = new Date().toISOString();
  const client: ClientFolder = {
    id: clientCode(new Set(clients.map((item) => item.id))),
    name: cleanName,
    notes: notes.trim().slice(0, 500),
    ownerId: actor.id,
    createdAt: now,
    updatedAt: now,
    history: [{ at: now, byId: actor.id, byName: actor.name, change: "Carpeta creada" }],
  };
  await writeClients([client, ...clients]);
  return client;
}

export async function updateClient(
  id: string,
  patch: { name?: string; notes?: string },
  actor: { id: string; name: string },
) {
  const clients = await readClients();
  const current = clients.find((item) => item.id === id);
  if (!current) return null;
  const name = patch.name !== undefined ? patch.name.trim().slice(0, 80) : current.name;
  if (!name) throw new Error("Falta el nombre del negocio");
  const notes = patch.notes !== undefined ? patch.notes.trim().slice(0, 500) : current.notes;
  const changes: string[] = [];
  if (name !== current.name) changes.push(`Nombre: ${current.name} → ${name}`);
  if (notes !== current.notes) changes.push("Notas actualizadas");
  if (changes.length === 0) return current;
  const now = new Date().toISOString();
  const next: ClientFolder = {
    ...current,
    name,
    notes,
    updatedAt: now,
    history: [
      { at: now, byId: actor.id, byName: actor.name, change: changes.join(". ") },
      ...current.history,
    ].slice(0, 40),
  };
  await writeClients(clients.map((item) => (item.id === id ? next : item)));
  return next;
}

function eligible(item: QrItem, account: Pick<Account, "id" | "role">) {
  if (item.clientId || item.active === false || item.status === "bloqueado") return false;
  if (account.role === "admin") return item.status === "disponible";
  return item.ownerId === account.id;
}

function cartelOrder(item: QrItem) {
  const value = Number(String(item.cartelId || "").replace(/\D/g, ""));
  return Number.isFinite(value) ? value : 0;
}

export async function assignStockToClient(clientId: string, count: number, actor: { id: string; name: string; role: Account["role"] }) {
  const amount = Math.min(100, Math.max(1, Math.floor(count)));
  const clients = await readClients();
  const client = clients.find((item) => item.id === clientId);
  if (!client) return null;
  const items = await readCatalog();
  const pool = items.filter((item) => eligible(item, actor)).sort((a, b) => cartelOrder(a) - cartelOrder(b));
  const chosen = pool.slice(0, amount);
  if (chosen.length === 0) return { client, assigned: [] as QrItem[], available: 0 };
  const chosenIds = new Set(chosen.map((item) => item.id));
  const now = new Date().toISOString();
  const next = items.map((item) => {
    if (!chosenIds.has(item.id)) return item;
    const move: ClientMove = {
      at: now,
      fromId: "",
      fromName: "Sin carpeta",
      toId: client.id,
      toName: client.name,
      byId: actor.id,
      byName: actor.name,
    };
    return {
      ...item,
      clientId: client.id,
      clientMoves: [move, ...(item.clientMoves || [])].slice(0, 20),
      updatedAt: now,
    };
  });
  await writeCatalog(next);
  return { client, assigned: next.filter((item) => chosenIds.has(item.id)), available: pool.length };
}

export async function movePosters(
  sourceId: string,
  targetId: string,
  ids: string[],
  actor: { id: string; name: string },
) {
  const clients = await readClients();
  const source = clients.find((item) => item.id === sourceId);
  const target = clients.find((item) => item.id === targetId);
  if (!source || !target || source.id === target.id) return null;
  const wanted = new Set(ids);
  const items = await readCatalog();
  const now = new Date().toISOString();
  let moved = 0;
  const next = items.map((item) => {
    if (!wanted.has(item.id) || item.clientId !== source.id) return item;
    moved += 1;
    const move: ClientMove = {
      at: now,
      fromId: source.id,
      fromName: source.name,
      toId: target.id,
      toName: target.name,
      byId: actor.id,
      byName: actor.name,
    };
    return {
      ...item,
      clientId: target.id,
      clientMoves: [move, ...(item.clientMoves || [])].slice(0, 20),
      updatedAt: now,
    };
  });
  if (moved === 0) return { moved: 0 };
  await writeCatalog(next);
  return { moved };
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

async function probeUrl(url: string) {
  const attempt = async (method: "HEAD" | "GET") => {
    const response = await fetch(url, {
      method,
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
      headers: { "user-agent": "ReviewsGO-verify" },
    });
    return response.status;
  };
  try {
    let status = await attempt("HEAD");
    if (status === 405 || status === 501) status = await attempt("GET");
    if (status >= 200 && status < 400) return { result: "ok" as const, detail: `Respuesta ${status}` };
    return { result: "error" as const, detail: `Respuesta ${status}` };
  } catch {
    return { result: "error" as const, detail: "No se pudo abrir el destino" };
  }
}

export async function verifyPosters(clientId: string, ids: string[]) {
  const wanted = new Set(ids.slice(0, 25));
  const items = await readCatalog();
  const chosen = items.filter((item) => wanted.has(item.id) && item.clientId === clientId);
  const checks = new Map<string, QrItem["lastCheck"]>();
  for (const item of chosen) {
    const at = new Date().toISOString();
    if (!item.id || (!item.cartelId && !item.uniqueCode)) {
      checks.set(item.id, { at, result: "error", detail: "Falta el identificador del cartel" });
      continue;
    }
    const url = (item.url || "").trim();
    if (!url) continue;
    if (!isHttpUrl(url)) {
      checks.set(item.id, { at, result: "error", detail: "La URL guardada no es válida" });
      continue;
    }
    const probe = await probeUrl(url);
    checks.set(item.id, { at, result: probe.result, detail: probe.detail });
  }
  if (checks.size === 0) return [];
  const next = items.map((item) => {
    const lastCheck = checks.get(item.id);
    return lastCheck ? { ...item, lastCheck } : item;
  });
  await writeCatalog(next);
  return next.filter((item) => checks.has(item.id));
}
