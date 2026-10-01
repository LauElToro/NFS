"use server";

import { DomainError } from "@nfs/domain";
import { redirect } from "next/navigation";
import { authenticate } from "@/lib/accounts";
import { getContainer } from "@/lib/container";
import { createSession, destroySession, requireSession } from "@/lib/session";

function formString(form: FormData, key: string) {
  return String(form.get(key) ?? "").trim();
}

export async function registerAction(_form: FormData) {
  return { error: "Las cuentas las crea el administrador" };
}

export async function loginAction(form: FormData) {
  const user = await authenticate(formString(form, "email"), formString(form, "password"));
  if (!user) return { error: "Credenciales inválidas" };
  if (!user.active) return { error: "Esta cuenta está desactivada" };
  await createSession({ id: user.id, email: user.email });
  redirect("/app");
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}

export async function createQrAction(form: FormData) {
  const session = await requireSession();
  try {
    await getContainer().createQrCode.execute({
      ownerId: session.id,
      title: formString(form, "title"),
      destinationUrl: formString(form, "destinationUrl"),
      campaignLabel: formString(form, "campaignLabel") || null,
    });
  } catch (e) {
    return { error: e instanceof DomainError ? e.message : "Error al crear QR" };
  }
  redirect("/app");
}

export async function updateQrAction(form: FormData) {
  const session = await requireSession();
  try {
    await getContainer().updateQrCode.execute({
      id: formString(form, "id"),
      ownerId: session.id,
      title: formString(form, "title"),
      destinationUrl: formString(form, "destinationUrl"),
      isActive: formString(form, "isActive") === "true",
      campaignLabel: formString(form, "campaignLabel") || null,
    });
  } catch (e) {
    return { error: e instanceof DomainError ? e.message : "Error al actualizar" };
  }
  redirect(`/app/qrs/${formString(form, "id")}`);
}
