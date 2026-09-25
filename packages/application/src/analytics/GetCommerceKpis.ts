import type {
  DeviceType,
  QrCodeRepository,
  ScanEventRepository,
} from "@nfs/domain";

export interface CommerceKpis {
  totalScans: number;
  uniqueVisitors: number;
  scansLast7d: number;
  byDevice: Record<DeviceType, number>;
  byHour: { hour: number; count: number }[];
  byDayOfWeek: { day: number; count: number }[];
  ranking: {
    qrId: string;
    title: string;
    slug: string;
    scans: number;
    campaignLabel: string | null;
  }[];
  insights: string[];
}

export class GetCommerceKpis {
  constructor(
    private readonly qrs: QrCodeRepository,
    private readonly scans: ScanEventRepository,
  ) {}

  async execute(ownerId: string): Promise<CommerceKpis> {
    const qrs = await this.qrs.listByOwner(ownerId);
    const allScans = await this.scans.listByOwner(ownerId);
    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

    const byDevice: Record<DeviceType, number> = {
      mobile: 0,
      tablet: 0,
      desktop: 0,
    };
    const hourMap = new Map<number, number>();
    const dowMap = new Map<number, number>();
    const unique = new Set<string>();
    let scansLast7d = 0;

    for (const s of allScans) {
      byDevice[s.deviceType] += 1;
      unique.add(s.visitorHash);
      if (s.scannedAt.getTime() >= weekAgo) scansLast7d += 1;
      const hour = s.scannedAt.getHours();
      hourMap.set(hour, (hourMap.get(hour) ?? 0) + 1);
      const dow = s.scannedAt.getDay();
      dowMap.set(dow, (dowMap.get(dow) ?? 0) + 1);
    }

    const scansByQr = new Map<string, number>();
    for (const s of allScans) {
      scansByQr.set(s.qrCodeId, (scansByQr.get(s.qrCodeId) ?? 0) + 1);
    }

    const ranking = qrs
      .map((qr) => ({
        qrId: qr.id,
        title: qr.title,
        slug: qr.slug,
        scans: scansByQr.get(qr.id) ?? 0,
        campaignLabel: qr.campaign.label,
      }))
      .sort((a, b) => b.scans - a.scans);

    const insights: string[] = [];
    const total = allScans.length || 1;
    const mobilePct = Math.round((byDevice.mobile / total) * 100);
    if (allScans.length > 0) {
      insights.push(`${mobilePct}% de los escaneos vienen de móviles`);
    }
    let peakHour = 0;
    let peakCount = 0;
    for (const [h, c] of hourMap) {
      if (c > peakCount) {
        peakHour = h;
        peakCount = c;
      }
    }
    if (peakCount > 0) {
      insights.push(`Pico de escaneos alrededor de las ${peakHour}:00`);
    }
    if (ranking[0] && ranking[0].scans > 0) {
      insights.push(
        `El QR más escaneado es "${ranking[0].title}" (${ranking[0].scans} escaneos)`,
      );
    }

    return {
      totalScans: allScans.length,
      uniqueVisitors: unique.size,
      scansLast7d,
      byDevice,
      byHour: [...hourMap.entries()]
        .map(([hour, count]) => ({ hour, count }))
        .sort((a, b) => a.hour - b.hour),
      byDayOfWeek: [...dowMap.entries()]
        .map(([day, count]) => ({ day, count }))
        .sort((a, b) => a.day - b.day),
      ranking,
      insights,
    };
  }
}
