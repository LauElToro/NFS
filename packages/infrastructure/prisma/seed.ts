import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { createHash, randomUUID } from "node:crypto";

const prisma = new PrismaClient();

async function main() {
  const email = "luca-qrs@nfs.com";
  const passwordHash = await bcrypt.hash("Luca123!", 10);

  await prisma.scanEvent.deleteMany();
  await prisma.qrCode.deleteMany();
  await prisma.user.deleteMany();

  const user = await prisma.user.create({
    data: {
      id: randomUUID(),
      email,
      passwordHash,
    },
  });

  const qrs = await Promise.all([
    prisma.qrCode.create({
      data: {
        id: randomUUID(),
        userId: user.id,
        slug: "menu-terraza",
        title: "Menú terraza",
        destinationUrl: "https://example.com/menu-terraza",
        campaignLabel: "Menú terraza",
        updatedAt: new Date(),
      },
    }),
    prisma.qrCode.create({
      data: {
        id: randomUUID(),
        userId: user.id,
        slug: "promo-2x1",
        title: "Promo 2x1",
        destinationUrl: "https://example.com/promo-2x1",
        campaignLabel: "Promo 2x1",
        updatedAt: new Date(),
      },
    }),
    prisma.qrCode.create({
      data: {
        id: randomUUID(),
        userId: user.id,
        slug: "carta-delivery",
        title: "Carta delivery",
        destinationUrl: "https://example.com/delivery",
        campaignLabel: "Delivery",
        updatedAt: new Date(),
      },
    }),
  ]);

  const uas = [
    {
      ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
      device: "mobile" as const,
      browser: "Safari",
      os: "iOS",
    },
    {
      ua: "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile",
      device: "mobile" as const,
      browser: "Chrome",
      os: "Android",
    },
    {
      ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0",
      device: "desktop" as const,
      browser: "Chrome",
      os: "Windows",
    },
    {
      ua: "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
      device: "tablet" as const,
      browser: "Safari",
      os: "iOS",
    },
  ];

  const now = Date.now();
  const events = [];
  for (let i = 0; i < 80; i++) {
    const qr = qrs[i % qrs.length]!;
    const profile = uas[i % uas.length]!;
    const scannedAt = new Date(now - i * 3 * 60 * 60 * 1000);
    const day = scannedAt.toISOString().slice(0, 10);
    const visitorHash = createHash("sha256")
      .update(`seed-${i % 25}|${profile.ua}|${day}`)
      .digest("hex")
      .slice(0, 32);
    events.push({
      id: randomUUID(),
      qrCodeId: qr.id,
      scannedAt,
      userAgent: profile.ua,
      deviceType: profile.device,
      browser: profile.browser,
      os: profile.os,
      acceptLanguage: "es-AR,es;q=0.9",
      visitorHash,
      referer: null,
    });
  }

  await prisma.scanEvent.createMany({ data: events });
  console.log(
    `Seed OK: Luca-QRS@NFS.com / Luca123! — ${qrs.length} QRs, ${events.length} escaneos`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
