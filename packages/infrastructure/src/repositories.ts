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

function toQr(row: QrRecord): QrCode {
  return QrCode.rehydrate({
    id: row.id,
    ownerId: row.ownerId,
    slug: row.slug,
    title: row.title,
    destinationUrl: row.destinationUrl,
    isActive: row.isActive,
    campaign: { label: row.campaignLabel },
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  });
}

function toRecord(qr: QrCode): QrRecord {
  const p = qr.toProps();
  return {
    id: p.id,
    ownerId: p.ownerId,
    slug: p.slug,
    title: p.title,
    destinationUrl: p.destinationUrl,
    isActive: p.isActive,
    campaignLabel: p.campaign.label,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
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
    const row = readQrs().find((qr) => qr.id === id);
    return row ? toQr(row) : null;
  }

  async findBySlug(slug: string) {
    const row = readQrs().find((qr) => qr.slug === slug);
    return row ? toQr(row) : null;
  }

  async listByOwner(ownerId: string) {
    return readQrs()
      .filter((qr) => qr.ownerId === ownerId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map(toQr);
  }

  async countByOwner(ownerId: string) {
    return readQrs().filter((qr) => qr.ownerId === ownerId).length;
  }

  async save(qr: QrCode) {
    const next = toRecord(qr);
    const rows = readQrs().filter((row) => row.id !== next.id && row.slug !== next.slug);
    rows.push(next);
    writeQrs(rows);
  }

  async delete(id: string) {
    writeQrs(readQrs().filter((qr) => qr.id !== id));
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
    const ids = new Set(readQrs().filter((qr) => qr.ownerId === ownerId).map((qr) => qr.id));
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
