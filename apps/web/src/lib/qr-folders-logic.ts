export type FolderRole = "admin" | "reseller";

export type FolderActor = {
  id: string;
  role: FolderRole;
};

export type FolderQr = {
  id: string;
  ownerId?: string;
};

export type FolderRecord = {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  qrIds: string[];
};

export const FOLDER_NAME_LIMIT = 80;
export const FOLDER_QR_LIMIT = 5000;
export const FOLDER_BATCH_LIMIT = 500;

export function cleanFolderName(value: string) {
  return value.trim().slice(0, FOLDER_NAME_LIMIT);
}

export function uniqueIds(ids: string[]) {
  const seen = new Set<string>();
  const next: string[] = [];
  for (const value of ids) {
    const id = String(value || "").trim();
    if (!id || id.length > 80 || seen.has(id)) continue;
    seen.add(id);
    next.push(id);
    if (next.length >= FOLDER_BATCH_LIMIT) break;
  }
  return next;
}

export function canUseQr(actor: FolderActor, item: FolderQr | undefined) {
  if (!item) return false;
  if (actor.role === "admin") return true;
  return item.ownerId === actor.id;
}

export function splitQrAccess(actor: FolderActor, catalog: FolderQr[], ids: string[]) {
  const byId = new Map(catalog.map((item) => [item.id, item]));
  const accepted: string[] = [];
  const rejected: string[] = [];
  for (const id of uniqueIds(ids)) {
    if (canUseQr(actor, byId.get(id))) accepted.push(id);
    else rejected.push(id);
  }
  return { accepted, rejected };
}

export function mergeQrIds(current: string[], incoming: string[]) {
  const qrIds = [...current];
  const seen = new Set(current);
  let added = 0;
  for (const id of incoming) {
    if (seen.has(id)) continue;
    if (qrIds.length >= FOLDER_QR_LIMIT) break;
    seen.add(id);
    qrIds.push(id);
    added += 1;
  }
  return { qrIds, added };
}

export function dropQrIds(current: string[], incoming: string[]) {
  const drop = new Set(incoming);
  const qrIds = current.filter((id) => !drop.has(id));
  return { qrIds, removed: current.length - qrIds.length };
}

export function visibleQrIds(qrIds: string[], allowed: Set<string>) {
  const seen = new Set<string>();
  const next: string[] = [];
  for (const id of qrIds) {
    if (!allowed.has(id) || seen.has(id)) continue;
    seen.add(id);
    next.push(id);
  }
  return next;
}

export function canManageFolder(actorId: string, folder: Pick<FolderRecord, "ownerId"> | undefined) {
  return Boolean(folder && folder.ownerId === actorId);
}
