import { readQrs } from "@nfs/infrastructure";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const qrs = readQrs();
    return NextResponse.json({ ok: true, service: "nfs-web", qrs: qrs.length });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "data error" },
      { status: 503 },
    );
  }
}
