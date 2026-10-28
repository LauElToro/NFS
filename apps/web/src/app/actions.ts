"use server";

import { redirect } from "next/navigation";
import { authenticate } from "@/lib/accounts";
import { safeConfigPath } from "@/lib/poster-lookup";
import { createSession, destroySession } from "@/lib/session";

function formString(form: FormData, key: string) {
  return String(form.get(key) ?? "").trim();
}

export async function loginAction(form: FormData) {
  const user = await authenticate(formString(form, "email"), formString(form, "password"));
  if (!user) return { error: "Credenciales inválidas" };
  if (!user.active) return { error: "Esta cuenta está desactivada" };
  await createSession({ id: user.id, email: user.email });
  redirect(safeConfigPath(formString(form, "next")) || "/app");
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}
