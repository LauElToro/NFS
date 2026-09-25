"use server";

import { DomainError } from "@nfs/domain";
import { redirect } from "next/navigation";
import { getContainer } from "@/lib/container";
import { createSession, destroySession, requireSession } from "@/lib/session";

function formString(form: FormData, key: string) {
  return String(form.get(key) ?? "").trim();
}

export async function registerAction(form: FormData) {
  try {
    const user = await getContainer().registerUser.execute({
      email: formString(form, "email"),
      password: formString(form, "password"),
    });
    await createSession({ id: user.id, email: user.email });
  } catch (e) {
    return { error: e instanceof DomainError ? e.message : "No se pudo registrar" };
  }
  redirect("/app");
}

export async function loginAction(form: FormData) {
  try {
    const user = await getContainer().authenticateUser.execute({
      email: formString(form, "email"),
      password: formString(form, "password"),
    });
    await createSession({ id: user.id, email: user.email });
  } catch (e) {
    return { error: e instanceof DomainError ? e.message : "No se pudo entrar" };
  }
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
