import { NextResponse } from "next/server";
import { prisma } from "@nfs/infrastructure";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, service: "nfs-web" });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "db error" },
      { status: 503 },
    );
  }
}
