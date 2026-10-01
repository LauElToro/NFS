import { NextResponse } from "next/server";
import { createReseller, readAccounts, toPublic } from "@/lib/accounts";
import { currentAccount } from "@/lib/access";
import { readCatalog } from "@/lib/qr-catalog";

export const dynamic = "force-dynamic";

export async function GET() {
  const account = await currentAccount();
  if (!account || account.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const [users, qrs] = await Promise.all([readAccounts(), readCatalog()]);
  const resellers = users.filter((user) => user.role === "reseller").map((user) => ({
    ...toPublic(user),
    qrCount: qrs.filter((qr) => qr.ownerId === user.id).length,
  }));
  return NextResponse.json(resellers);
}

export async function POST(req: Request) {
  const account = await currentAccount();
  if (!account || account.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await req.json()) as {
    name?: string;
    email?: string;
    password?: string;
    credits?: number;
  };
  try {
    const created = await createReseller({
      name: body.name ?? "",
      email: body.email ?? "",
      password: body.password ?? "",
      credits: Number(body.credits ?? 0),
    });
    return NextResponse.json(toPublic(created));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo crear" },
      { status: 400 },
    );
  }
}
