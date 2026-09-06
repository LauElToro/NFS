import {
  QrCode,
  ScanEvent,
  type MerchantAccount,
  type QrCodeRepository,
  type ScanEventRepository,
  type UserRepository,
} from "@nfs/domain";
import type { PrismaClient } from "@prisma/client";

function toQr(row: {
  id: string;
  userId: string;
  slug: string;
  title: string;
  destinationUrl: string;
  isActive: boolean;
  campaignLabel: string | null;
  createdAt: Date;
  updatedAt: Date;
}): QrCode {
  return QrCode.rehydrate({
    id: row.id,
    ownerId: row.userId,
    slug: row.slug,
    title: row.title,
    destinationUrl: row.destinationUrl,
    isActive: row.isActive,
    campaign: {
      label: row.campaignLabel,
    },
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

function toScan(row: {
  id: string;
  qrCodeId: string;
  scannedAt: Date;
  userAgent: string;
  deviceType: "mobile" | "tablet" | "desktop";
  browser: string | null;
  os: string | null;
  acceptLanguage: string | null;
  visitorHash: string;
  referer: string | null;
}): ScanEvent {
  return ScanEvent.create(row);
}

export class PrismaQrCodeRepository implements QrCodeRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(id: string) {
    const row = await this.db.qrCode.findUnique({ where: { id } });
    return row ? toQr(row) : null;
  }

  async findBySlug(slug: string) {
    const row = await this.db.qrCode.findUnique({ where: { slug } });
    return row ? toQr(row) : null;
  }

  async listByOwner(ownerId: string) {
    const rows = await this.db.qrCode.findMany({
      where: { userId: ownerId },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toQr);
  }

  async countByOwner(ownerId: string) {
    return this.db.qrCode.count({ where: { userId: ownerId } });
  }

  async save(qr: QrCode) {
    const p = qr.toProps();
    await this.db.qrCode.upsert({
      where: { id: p.id },
      create: {
        id: p.id,
        userId: p.ownerId,
        slug: p.slug,
        title: p.title,
        destinationUrl: p.destinationUrl,
        isActive: p.isActive,
        campaignLabel: p.campaign.label,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      },
      update: {
        title: p.title,
        destinationUrl: p.destinationUrl,
        isActive: p.isActive,
        campaignLabel: p.campaign.label,
        updatedAt: p.updatedAt,
      },
    });
  }

  async delete(id: string) {
    await this.db.qrCode.delete({ where: { id } });
  }
}

export class PrismaScanEventRepository implements ScanEventRepository {
  constructor(private readonly db: PrismaClient) {}

  async save(event: ScanEvent) {
    const p = event.props;
    await this.db.scanEvent.create({
      data: {
        id: p.id,
        qrCodeId: p.qrCodeId,
        scannedAt: p.scannedAt,
        userAgent: p.userAgent,
        deviceType: p.deviceType,
        browser: p.browser,
        os: p.os,
        acceptLanguage: p.acceptLanguage,
        visitorHash: p.visitorHash,
        referer: p.referer,
      },
    });
  }

  async listByOwner(ownerId: string, from?: Date) {
    const rows = await this.db.scanEvent.findMany({
      where: {
        qrCode: { userId: ownerId },
        ...(from ? { scannedAt: { gte: from } } : {}),
      },
      orderBy: { scannedAt: "desc" },
    });
    return rows.map(toScan);
  }

  async listByQr(qrCodeId: string, from?: Date) {
    const rows = await this.db.scanEvent.findMany({
      where: {
        qrCodeId,
        ...(from ? { scannedAt: { gte: from } } : {}),
      },
    });
    return rows.map(toScan);
  }

  async countByQr(qrCodeId: string) {
    return this.db.scanEvent.count({ where: { qrCodeId } });
  }
}

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly db: PrismaClient) {}

  private map(row: {
    id: string;
    email: string;
    passwordHash: string;
    createdAt: Date;
  }): MerchantAccount {
    return {
      id: row.id,
      email: row.email,
      passwordHash: row.passwordHash,
      createdAt: row.createdAt,
    };
  }

  async findById(id: string) {
    const row = await this.db.user.findUnique({ where: { id } });
    return row ? this.map(row) : null;
  }

  async findByEmail(email: string) {
    const row = await this.db.user.findUnique({ where: { email } });
    return row ? this.map(row) : null;
  }

  async save(user: MerchantAccount) {
    await this.db.user.upsert({
      where: { id: user.id },
      create: {
        id: user.id,
        email: user.email,
        passwordHash: user.passwordHash,
        createdAt: user.createdAt,
      },
      update: {
        email: user.email,
        passwordHash: user.passwordHash,
      },
    });
  }
}
