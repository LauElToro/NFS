import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const PLACE_ID = /^[A-Za-z0-9_-]{10,255}$/;
const GOOGLE_REVIEW_PREFIX = "https://search.google.com/local/writereview?placeid=";

export const CODE_STATUSES = ["pendiente", "reservado", "activado", "revocado", "anulado"] as const;
export type CodeStatus = (typeof CODE_STATUSES)[number];

export const PUBLIC_STATUS: Record<CodeStatus, string> = {
  pendiente: "Pendiente de activación",
  reservado: "Pendiente de activación",
  activado: "Activado",
  revocado: "Revocado",
  anulado: "Anulado",
};

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const RESERVE_MS = 2 * 60 * 1000;
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const ATTEMPT_LIMIT = 12;

export type ActivationCode = {
  id: string;
  posterId: string;
  token: string;
  cartelId: string;
  lookup: string;
  salt: string;
  codeHash: string;
  status: CodeStatus;
  claim?: string;
  claimAt?: string;
  createdAt: string;
  activatedAt?: string;
  revokedAt?: string;
  batchId: string;
  editLookup?: string;
  editSalt?: string;
  editHash?: string;
  events: { at: string; type: string }[];
};

export type AttemptWindow = { start: number; count: number };

export class ActivationError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export function normalizeCode(value: string) {
  const compact = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return compact.startsWith("RG") && compact.length > 16 ? compact.slice(2) : compact;
}

export function formatCode(raw: string) {
  const groups = raw.match(/.{1,4}/g) || [];
  return `RG-${groups.join("-")}`;
}

function randomFromAlphabet(length: number) {
  let out = "";
  const limit = 256 - (256 % ALPHABET.length);
  while (out.length < length) {
    const bytes = randomBytes(length);
    for (const byte of bytes) {
      if (byte >= limit) continue;
      out += ALPHABET[byte % ALPHABET.length];
      if (out.length === length) break;
    }
  }
  return out;
}

export function generateActivationCode() {
  return formatCode(randomFromAlphabet(16));
}

export function generateEditToken() {
  return randomBytes(32).toString("base64url");
}

export function lookupKey(kind: "code" | "edit", value: string, pepper: string) {
  const material = kind === "code" ? normalizeCode(value) : value;
  return createHmac("sha256", pepper).update(`${kind}:${material}`).digest("hex");
}

export function fingerprint(value: string, pepper: string) {
  return createHmac("sha256", pepper).update(`ip:${value}`).digest("hex");
}

export function sealSecret(secret: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(secret, salt, 32).toString("hex");
  return { salt, hash };
}

export function secretMatches(secret: string, salt: string, hash: string) {
  const actual = scryptSync(secret, salt, 32);
  const expected = Buffer.from(hash, "hex");
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(actual, expected);
}

export function burnMissingSecret() {
  scryptSync("invalid", "reviewsgo-activation-dummy", 32);
}

export function destinationFromInput(value: string, type: string) {
  const raw = value.trim();
  if (!raw || raw.length > 2000 || /[<>"'`]/.test(raw)) return "";
  if (type === "google" && !raw.includes("://")) {
    const placeId = raw.trim();
    if (PLACE_ID.test(placeId)) return `${GOOGLE_REVIEW_PREFIX}${placeId}`;
  }
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return "";
  }
  if (url.protocol !== "https:" || url.username || url.password || !url.hostname) return "";
  if (url.hostname === "localhost" || url.hostname.endsWith(".local")) return "";
  return url.toString();
}

export function publicDestinationType(value: string): "google" | "instagram" | "whatsapp" | "web" | "otro" {
  if (value === "google" || value === "instagram" || value === "whatsapp" || value === "web") return value;
  return "otro";
}

function event(record: ActivationCode, at: string, type: string): ActivationCode {
  return { ...record, events: [{ at, type }, ...record.events].slice(0, 20) };
}

export function reserveCode(record: ActivationCode, claim: string, now: string) {
  const stale = record.status === "reservado" && Date.parse(record.claimAt || "") + RESERVE_MS < Date.parse(now);
  if (record.status === "activado") throw new ActivationError("Este código ya fue utilizado", 409);
  if (record.status === "revocado") throw new ActivationError("Este código fue revocado", 409);
  if (record.status === "anulado") throw new ActivationError("Este código fue anulado", 409);
  if (record.status === "reservado" && !stale) throw new ActivationError("La activación está en proceso. Esperá un momento y probá de nuevo.", 409);
  if (record.status !== "pendiente" && !stale) throw new ActivationError("El código no es válido", 400);
  return event({ ...record, status: "reservado", claim, claimAt: now }, now, "reserva");
}

export function completeCode(record: ActivationCode, claim: string, edit: { lookup: string; salt: string; hash: string }, now: string) {
  if (record.status !== "reservado" || record.claim !== claim) {
    throw new ActivationError("No se pudo confirmar la activación. Intentá de nuevo.", 409);
  }
  return event(
    {
      ...record,
      status: "activado",
      activatedAt: now,
      claim: undefined,
      claimAt: undefined,
      editLookup: edit.lookup,
      editSalt: edit.salt,
      editHash: edit.hash,
    },
    now,
    "activado",
  );
}

export function revokeCode(record: ActivationCode, now: string) {
  if (record.status !== "pendiente") throw new ActivationError("Solo se puede revocar un código pendiente", 409);
  return event({ ...record, status: "revocado", revokedAt: now }, now, "revocado");
}

export function annulCode(record: ActivationCode, now: string) {
  if (record.status !== "pendiente" && record.status !== "activado" && record.status !== "reservado") {
    throw new ActivationError("Ese código ya no se puede anular", 409);
  }
  return event({ ...record, status: "anulado", revokedAt: now, claim: undefined }, now, "anulado");
}

export function registerAttempt(windows: Record<string, AttemptWindow>, key: string, now: number) {
  const next: Record<string, AttemptWindow> = {};
  for (const [entryKey, entry] of Object.entries(windows)) {
    if (now - entry.start < ATTEMPT_WINDOW_MS) next[entryKey] = entry;
  }
  const current = next[key];
  const fresh = !current || now - current.start >= ATTEMPT_WINDOW_MS;
  const count = fresh ? 1 : current.count + 1;
  next[key] = { start: fresh ? now : current.start, count };
  const trimmed = Object.fromEntries(Object.entries(next).slice(-500));
  return { windows: trimmed, blocked: count > ATTEMPT_LIMIT };
}
