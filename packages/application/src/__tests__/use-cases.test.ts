import { describe, expect, it } from "vitest";
import {
  QrCode,
  ScanEvent,
  type Clock,
  type IdGenerator,
  type MerchantAccount,
  type QrCodeRepository,
  type ScanEventRepository,
  type UserRepository,
} from "@nfs/domain";
import { CreateQrCode } from "../qr/CreateQrCode.js";
import { GetCommerceKpis } from "../analytics/GetCommerceKpis.js";
import { RecordScanAndRedirect } from "../scanning/RecordScanAndRedirect.js";

class MemIds implements IdGenerator {
  n = 0;
  generate() {
    this.n += 1;
    return `id-${this.n}`;
  }
}

class FixedClock implements Clock {
  constructor(private d: Date) {}
  now() {
    return this.d;
  }
}

function memoryRepos() {
  const qrs = new Map<string, QrCode>();
  const bySlug = new Map<string, string>();
  const scans: ScanEvent[] = [];
  const users = new Map<string, MerchantAccount>();

  const qrRepo: QrCodeRepository = {
    async findById(id) {
      return qrs.get(id) ?? null;
    },
    async findBySlug(slug) {
      const id = bySlug.get(slug);
      return id ? (qrs.get(id) ?? null) : null;
    },
    async listByOwner(ownerId) {
      return [...qrs.values()].filter((q) => q.ownerId === ownerId);
    },
    async countByOwner(ownerId) {
      return [...qrs.values()].filter((q) => q.ownerId === ownerId).length;
    },
    async save(qr) {
      qrs.set(qr.id, qr);
      bySlug.set(qr.slug, qr.id);
    },
    async delete(id) {
      const qr = qrs.get(id);
      if (qr) {
        qrs.delete(id);
        bySlug.delete(qr.slug);
      }
    },
  };

  const scanRepo: ScanEventRepository = {
    async save(e) {
      scans.push(e);
    },
    async listByOwner(ownerId) {
      const ids = new Set(
        [...qrs.values()].filter((q) => q.ownerId === ownerId).map((q) => q.id),
      );
      return scans.filter((s) => ids.has(s.qrCodeId));
    },
    async listByQr(qrCodeId) {
      return scans.filter((s) => s.qrCodeId === qrCodeId);
    },
    async countByQr(qrCodeId) {
      return scans.filter((s) => s.qrCodeId === qrCodeId).length;
    },
  };

  const userRepo: UserRepository = {
    async findById(id) {
      return users.get(id) ?? null;
    },
    async findByEmail(email) {
      return [...users.values()].find((u) => u.email === email) ?? null;
    },
    async save(u) {
      users.set(u.id, u);
    },
  };

  return { qrRepo, scanRepo, userRepo, users };
}

describe("CreateQrCode + RecordScanAndRedirect + KPIs", () => {
  it("crea QR, registra escaneo y calcula KPIs", async () => {
    const { qrRepo, scanRepo, userRepo, users } = memoryRepos();
    users.set("u1", {
      id: "u1",
      email: "a@b.com",
      passwordHash: "x",
      createdAt: new Date(),
    });

    const create = new CreateQrCode(
      qrRepo,
      userRepo,
      new MemIds(),
      new FixedClock(new Date("2026-01-15T20:00:00Z")),
    );
    const qr = await create.execute({
      ownerId: "u1",
      title: "Menu terraza",
      destinationUrl: "https://comercio.example/menu",
    });

    const scan = new RecordScanAndRedirect(
      qrRepo,
      scanRepo,
      new MemIds(),
      new FixedClock(new Date("2026-01-15T20:30:00Z")),
    );
    const result = await scan.execute({
      slug: qr.slug,
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
      ip: "1.2.3.4",
      acceptLanguage: "es-AR",
      referer: null,
    });
    expect(result.destinationUrl).toContain("comercio.example");

    const kpis = await new GetCommerceKpis(qrRepo, scanRepo).execute("u1");
    expect(kpis.totalScans).toBe(1);
    expect(kpis.byDevice.mobile).toBe(1);
    expect(kpis.ranking[0]?.scans).toBe(1);
  });
});
