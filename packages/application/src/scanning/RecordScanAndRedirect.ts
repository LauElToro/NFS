import {
  DomainError,
  ScanEvent,
  classifyDevice,
  parseBrowser,
  parseOs,
  type Clock,
  type IdGenerator,
  type QrCodeRepository,
  type ScanEventRepository,
} from "@nfs/domain";
import { createHash } from "node:crypto";

export class RecordScanAndRedirect {
  constructor(
    private readonly qrs: QrCodeRepository,
    private readonly scans: ScanEventRepository,
    private readonly ids: IdGenerator,
    private readonly clock: Clock,
  ) {}

  async execute(input: {
    slug: string;
    userAgent: string;
    ip: string;
    acceptLanguage: string | null;
    referer: string | null;
  }): Promise<{ destinationUrl: string }> {
    const qr = await this.qrs.findBySlug(input.slug);
    if (!qr || !qr.isActive) {
      throw new DomainError("QR no disponible");
    }

    const now = this.clock.now();
    const day = now.toISOString().slice(0, 10);
    const visitorHash = createHash("sha256")
      .update(`${input.ip}|${input.userAgent}|${day}`)
      .digest("hex")
      .slice(0, 32);

    const event = ScanEvent.create({
      id: this.ids.generate(),
      qrCodeId: qr.id,
      scannedAt: now,
      userAgent: input.userAgent.slice(0, 512),
      deviceType: classifyDevice(input.userAgent),
      browser: parseBrowser(input.userAgent),
      os: parseOs(input.userAgent),
      acceptLanguage: input.acceptLanguage,
      visitorHash,
      referer: input.referer,
    });

    await this.scans.save(event);
    return { destinationUrl: qr.destinationUrl };
  }
}
