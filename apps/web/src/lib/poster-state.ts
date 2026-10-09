import type { QrItem } from "./qr-store";

export type SetupState = "pendiente" | "funcionando" | "error" | "sin-verificar";

export const SETUP_LABELS: Record<SetupState, string> = {
  pendiente: "Pendiente",
  funcionando: "Funcionando",
  error: "Error",
  "sin-verificar": "Sin verificar",
};

export function posterSetupState(item: Pick<QrItem, "id" | "cartelId" | "uniqueCode" | "url" | "lastCheck">): SetupState {
  if (!item.id || (!item.cartelId && !item.uniqueCode)) return "error";
  if (!(item.url || "").trim()) return "pendiente";
  if (item.lastCheck?.result === "ok") return "funcionando";
  if (item.lastCheck?.result === "error") return "error";
  return "sin-verificar";
}
