import {
  QrCode,
  ScanEvent,
  type MerchantAccount,
  type QrCodeRepository,
  type ScanEventRepository,
  type UserRepository,
} from "@nfs/domain";
import {
  readQrs,
  readScans,
  readUsers,
  writeQrs,
  writeScans,
  writeUsers,
  type QrRecord,
  type ScanRecord,
  type UserRecord,
} from "./json-store.js";

const OWNER_ID = "user-luca";
const STABLE_DATE = new Date("2026-01-01T00:00:00.000Z");

export function slugFromTitle(title: string): string {
  return (
    title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48) || "qr"
  );
}

function toQr(row: QrRecord): QrCode {
  const slug = slugFromTitle(row.title);
  return QrCode.rehydrate({
    id: slug,
    ownerId: OWNER_ID,
    slug,
    title: row.title,
    destinationUrl: row.url,
    isActive: true,
    campaign: { label: null },
    createdAt: STABLE_DATE,
    updatedAt: STABLE_DATE,
  });
}

function toRecord(qr: QrCode): QrRecord | null {
  const p = qr.toProps();
  if (!p.isActive) return null;
  return {
    title: p.title,
    url: p.destinationUrl,
  };
}

function toScan(row: ScanRecord): ScanEvent {
  return ScanEvent.create({
    ...row,
    scannedAt: new Date(row.scannedAt),
  });
}

export class JsonQrCodeRepository implements QrCodeRepository {
  async findById(id: string) {
    const row = readQrs().find((qr) => slugFromTitle(qr.title) === id);
    return row ? toQr(row) : null;
  }

  async findBySlug(slug: string) {
    const row = readQrs().find((qr) => slugFromTitle(qr.title) === slug);
    return row ? toQr(row) : null;
  }

  async listByOwner() {
    return readQrs().map(toQr);
  }

  async countByOwner() {
    return readQrs().length;
  }

  async save(qr: QrCode) {
    const next = toRecord(qr);
    const slug = qr.slug;
    const rows = readQrs().filter((row) => slugFromTitle(row.title) !== slug);
    if (next) rows.push(next);
    writeQrs(rows);
  }

  async delete(id: string) {
    writeQrs(readQrs().filter((qr) => slugFromTitle(qr.title) !== id));
  }
}

export class JsonScanEventRepository implements ScanEventRepository {
  async save(event: ScanEvent) {
    const p = event.props;
    const rows = readScans();
    rows.push({
      id: p.id,
      qrCodeId: p.qrCodeId,
      scannedAt: p.scannedAt.toISOString(),
      userAgent: p.userAgent,
      deviceType: p.deviceType,
      browser: p.browser,
      os: p.os,
      acceptLanguage: p.acceptLanguage,
      visitorHash: p.visitorHash,
      referer: p.referer,
    });
    writeScans(rows);
  }

  async listByOwner(ownerId: string, from?: Date) {
    const ids = new Set(
      readQrs()
        .filter(() => ownerId === OWNER_ID)
        .map((qr) => slugFromTitle(qr.title)),
    );
    return readScans()
      .filter((row) => ids.has(row.qrCodeId) && (!from || row.scannedAt >= from.toISOString()))
      .sort((a, b) => b.scannedAt.localeCompare(a.scannedAt))
      .map(toScan);
  }

  async listByQr(qrCodeId: string, from?: Date) {
    return readScans()
      .filter((row) => row.qrCodeId === qrCodeId && (!from || row.scannedAt >= from.toISOString()))
      .map(toScan);
  }

  async countByQr(qrCodeId: string) {
    return readScans().filter((row) => row.qrCodeId === qrCodeId).length;
  }
}

export class JsonUserRepository implements UserRepository {
  private map(row: UserRecord): MerchantAccount {
    return {
      id: row.id,
      email: row.email,
      passwordHash: row.passwordHash,
      createdAt: new Date(row.createdAt),
    };
  }

  async findById(id: string) {
    const row = readUsers().find((user) => user.id === id);
    return row ? this.map(row) : null;
  }

  async findByEmail(email: string) {
    const row = readUsers().find((user) => user.email === email.toLowerCase());
    return row ? this.map(row) : null;
  }

  async save(user: MerchantAccount) {
    const rows = readUsers().filter((row) => row.id !== user.id);
    rows.push({
      id: user.id,
      email: user.email.toLowerCase(),
      passwordHash: user.passwordHash,
      createdAt: user.createdAt.toISOString(),
    });
    writeUsers(rows);
  }
}
