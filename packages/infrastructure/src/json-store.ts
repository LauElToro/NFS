import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

export interface QrRecord {
  title: string;
  url: string;
}

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

export interface ScanRecord {
  id: string;
  qrCodeId: string;
  scannedAt: string;
  userAgent: string;
  deviceType: "mobile" | "tablet" | "desktop";
  browser: string | null;
  os: string | null;
  acceptLanguage: string | null;
  visitorHash: string;
  referer: string | null;
}

function dataDir(): string {
  const candidates = [
    process.env.NFS_DATA_DIR,
    path.resolve(process.cwd(), "data"),
    path.resolve(process.cwd(), "../../data"),
    path.resolve(process.cwd(), "../../../data"),
  ].filter((dir): dir is string => Boolean(dir));

  for (const dir of candidates) {
    const resolved = path.resolve(dir);
    if (existsSync(path.join(resolved, "qrs.json"))) return resolved;
  }

  return path.resolve(candidates[0] ?? path.resolve(process.cwd(), "data"));
}

function readJson<T>(file: string, fallback: T): T {
  const full = path.join(dataDir(), file);
  if (!existsSync(full)) return fallback;
  return JSON.parse(readFileSync(full, "utf8")) as T;
}

function writeJson(file: string, value: unknown): void {
  const dir = dataDir();
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, file), `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export function readQrs(): QrRecord[] {
  return readJson<QrRecord[]>("qrs.json", []);
}

export function writeQrs(qrs: QrRecord[]): void {
  writeJson("qrs.json", qrs);
}

export function readUsers(): UserRecord[] {
  return readJson<UserRecord[]>("users.json", []);
}

export function writeUsers(users: UserRecord[]): void {
  writeJson("users.json", users);
}

export function readScans(): ScanRecord[] {
  return readJson<ScanRecord[]>("scans.json", []);
}

export function writeScans(scans: ScanRecord[]): void {
  try {
    writeJson("scans.json", scans);
  } catch {
    // En Netlify el disco es de solo lectura. La redirección no depende de esto.
  }
}
