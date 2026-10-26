import { NextResponse } from "next/server";
import { currentAccount } from "@/lib/access";
import { ActivationError, issueBatch, listActivations } from "@/lib/activations";
import { publicOrigin } from "@/lib/request-origin";

export const dynamic = "force-dynamic";

function fail(error: unknown) {
  if (error instanceof ActivationError) return NextResponse.json({ error: error.message }, { status: error.status });
  console.error(error);
  return NextResponse.json({ error: "No se pudieron guardar las activaciones" }, { status: 500 });
}

async function admin() {
  const account = await currentAccount();
  if (!account || account.role !== "admin") return null;
  return account;
}

export async function GET(req: Request) {
  if (!(await admin())) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  try {
    const url = new URL(req.url);
    const data = await listActivations({
      q: url.searchParams.get("q") || "",
      status: url.searchParams.get("status") || "",
      batchId: url.searchParams.get("batch") || "",
      from: url.searchParams.get("from") || "",
      to: url.searchParams.get("to") || "",
    });
    return NextResponse.json(data, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(req: Request) {
  if (!(await admin())) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  try {
    const body = (await req.json()) as { quantity?: number; name?: string; notes?: string };
    const created = await issueBatch(
      { quantity: Number(body.quantity), name: body.name || "", notes: body.notes || "" },
      publicOrigin(req),
    );
    return NextResponse.json(created, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    return fail(error);
  }
}
