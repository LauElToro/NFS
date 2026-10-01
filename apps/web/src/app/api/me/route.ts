import { NextResponse } from "next/server";
import { currentAccount, publicActor } from "@/lib/access";

export const dynamic = "force-dynamic";

export async function GET() {
  const account = await currentAccount();
  if (!account) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(publicActor(account));
}
