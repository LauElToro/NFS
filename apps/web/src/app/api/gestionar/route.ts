import { NextResponse } from "next/server";
import { ActivationError, assertActivationAttempts, changeWithToken } from "@/lib/activations";
import { clientIp } from "@/lib/request-origin";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    await assertActivationAttempts(clientIp(req));
    const body = (await req.json()) as { token?: string; url?: string; destinationType?: string };
    const result = await changeWithToken(body.token || "", body.url, body.destinationType);
    return NextResponse.json(result, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    if (error instanceof ActivationError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error(error);
    return NextResponse.json({ error: "No se pudo usar el enlace" }, { status: 500 });
  }
}
