import { randomBytes } from "node:crypto";
import { readStored, writeStored } from "./blob-store";
import { readCatalog } from "./qr-catalog";
import type { QrItem } from "./qr-store";
import {
  canManageFolder,
  canUseQr,
  cleanFolderName,
  dropQrIds,
  mergeQrIds,
  splitQrAccess,
  visibleQrIds,
  type FolderActor,
  type FolderRecord,
} from "./qr-folders-logic";

const KEY = "qr-folders";

export class FolderError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export type FolderSummary = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  count: number;
};

function folderCode(taken: Set<string>) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  do {
    const bytes = randomBytes(4);
    code = `FLD-${Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("")}`;
  } while (taken.has(code));
  return code;
}

function normalize(data: unknown): FolderRecord[] {
  if (!Array.isArray(data)) return [];
  const folders: FolderRecord[] = [];
  for (const entry of data) {
    if (!entry || typeof entry !== "object") continue;
    const row = entry as Partial<FolderRecord>;
    const id = String(row.id || "").trim();
    const ownerId = String(row.ownerId || "").trim();
    const name = cleanFolderName(String(row.name || ""));
    if (!id || !ownerId || !name) continue;
    const qrIds: string[] = [];
    const seen = new Set<string>();
    for (const value of Array.isArray(row.qrIds) ? row.qrIds : []) {
      const qrId = String(value || "").trim();
      if (!qrId || seen.has(qrId)) continue;
      seen.add(qrId);
      qrIds.push(qrId);
    }
    folders.push({
      id,
      name,
      ownerId,
      createdAt: String(row.createdAt || new Date().toISOString()),
      updatedAt: String(row.updatedAt || row.createdAt || new Date().toISOString()),
      qrIds,
    });
  }
  return folders;
}

async function readFolders() {
  return normalize(await readStored<unknown>(KEY, []));
}

async function writeFolders(folders: FolderRecord[]) {
  await writeStored(KEY, folders);
}

function allowedIds(actor: FolderActor, catalog: QrItem[]) {
  return new Set(catalog.filter((item) => canUseQr(actor, item)).map((item) => item.id));
}

function summary(folder: FolderRecord, allowed: Set<string>): FolderSummary {
  return {
    id: folder.id,
    name: folder.name,
    createdAt: folder.createdAt,
    updatedAt: folder.updatedAt,
    count: visibleQrIds(folder.qrIds, allowed).length,
  };
}

function requireOwn(folders: FolderRecord[], actor: FolderActor, id: string) {
  const folder = folders.find((item) => item.id === id);
  if (!canManageFolder(actor.id, folder)) throw new FolderError("No encontramos esa carpeta", 404);
  return folder as FolderRecord;
}

export async function listFolders(actor: FolderActor, query = "") {
  const [folders, catalog] = await Promise.all([readFolders(), readCatalog()]);
  const allowed = allowedIds(actor, catalog);
  const text = query.trim().toLowerCase();
  return folders
    .filter((folder) => folder.ownerId === actor.id)
    .filter((folder) => !text || folder.name.toLowerCase().includes(text))
    .map((folder) => summary(folder, allowed));
}

export async function createFolder(actor: FolderActor, name: string, qrIds: string[] = []) {
  const cleanName = cleanFolderName(name);
  if (!cleanName) throw new FolderError("Escribí un nombre para la carpeta", 400);
  const catalog = await readCatalog();
  const access = splitQrAccess(actor, catalog, qrIds);
  if (qrIds.length > 0 && access.accepted.length === 0) {
    throw new FolderError("Esos QR no están disponibles para tu cuenta", 403);
  }
  const folders = await readFolders();
  const now = new Date().toISOString();
  const merged = mergeQrIds([], access.accepted);
  const folder: FolderRecord = {
    id: folderCode(new Set(folders.map((item) => item.id))),
    name: cleanName,
    ownerId: actor.id,
    createdAt: now,
    updatedAt: now,
    qrIds: merged.qrIds,
  };
  await writeFolders([folder, ...folders]);
  return {
    folder: summary(folder, allowedIds(actor, catalog)),
    added: merged.added,
    skipped: access.rejected.length + (access.accepted.length - merged.added),
  };
}

export async function getFolder(actor: FolderActor, id: string) {
  const [folders, catalog] = await Promise.all([readFolders(), readCatalog()]);
  const folder = requireOwn(folders, actor, id);
  const allowed = allowedIds(actor, catalog);
  const byId = new Map(catalog.map((item) => [item.id, item]));
  const posters = visibleQrIds(folder.qrIds, allowed)
    .map((qrId) => byId.get(qrId))
    .filter((item): item is QrItem => Boolean(item));
  return { folder: summary(folder, allowed), posters };
}

export async function renameFolder(actor: FolderActor, id: string, name: string) {
  const cleanName = cleanFolderName(name);
  if (!cleanName) throw new FolderError("Escribí un nombre para la carpeta", 400);
  const folders = await readFolders();
  const current = requireOwn(folders, actor, id);
  if (current.name === cleanName) return current;
  const now = new Date().toISOString();
  const next = folders.map((folder) => (folder.id === id ? { ...folder, name: cleanName, updatedAt: now } : folder));
  await writeFolders(next);
  return next.find((folder) => folder.id === id) as FolderRecord;
}

export async function deleteFolder(actor: FolderActor, id: string) {
  const folders = await readFolders();
  requireOwn(folders, actor, id);
  await writeFolders(folders.filter((folder) => folder.id !== id));
}

export async function addFolderQrs(actor: FolderActor, id: string, qrIds: string[]) {
  if (qrIds.length === 0) throw new FolderError("Seleccioná al menos un QR", 400);
  const [folders, catalog] = await Promise.all([readFolders(), readCatalog()]);
  const current = requireOwn(folders, actor, id);
  const access = splitQrAccess(actor, catalog, qrIds);
  if (access.accepted.length === 0) throw new FolderError("Esos QR no están disponibles para tu cuenta", 403);
  const merged = mergeQrIds(current.qrIds, access.accepted);
  const now = new Date().toISOString();
  const nextFolder = { ...current, qrIds: merged.qrIds, updatedAt: now };
  await writeFolders(folders.map((folder) => (folder.id === id ? nextFolder : folder)));
  return {
    folder: summary(nextFolder, allowedIds(actor, catalog)),
    added: merged.added,
    skipped: access.rejected.length,
  };
}

export async function removeFolderQrs(actor: FolderActor, id: string, qrIds: string[]) {
  const requested = qrIds.map((value) => String(value || "").trim()).filter(Boolean);
  if (requested.length === 0) throw new FolderError("Seleccioná al menos un QR", 400);
  const [folders, catalog] = await Promise.all([readFolders(), readCatalog()]);
  const current = requireOwn(folders, actor, id);
  const dropped = dropQrIds(current.qrIds, requested);
  const now = new Date().toISOString();
  const nextFolder = { ...current, qrIds: dropped.qrIds, updatedAt: now };
  await writeFolders(folders.map((folder) => (folder.id === id ? nextFolder : folder)));
  return { folder: summary(nextFolder, allowedIds(actor, catalog)), removed: dropped.removed };
}
