import { NextResponse } from "next/server";
import { activateWithCode, assertActivationAttempts, previewActivation, ActivationError } from "@/lib/activations";
import { clientIp, publicOrigin } from "@/lib/request-origin";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    await assertActivationAttempts(clientIp(req));
    const body = (await req.json()) as { action?: string; code?: string; url?: string; destinationType?: string };
    const code = body.code || "";
    if (body.action === "guardar") {
      const result = await activateWithCode(code, body.url || "", body.destinationType || "otro", publicOrigin(req));
      return NextResponse.json(result, { headers: { "cache-control": "no-store" } });
    }
    const result = await previewActivation(code);
    return NextResponse.json(result, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    if (error instanceof ActivationError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error(error);
    return NextResponse.json({ error: "No se pudo validar el código" }, { status: 500 });
  }
}
