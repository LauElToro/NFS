import type { QrItem } from "./qr-store";

export function findByPublicSlug(items: QrItem[], slug: string) {
  return items.find((item) => (item.token ? item.token === slug : item.id === slug || item.uniqueCode === slug));
}

export function displayCode(item: Pick<QrItem, "id" | "cartelId" | "uniqueCode">) {
  return item.cartelId || item.uniqueCode || item.id;
}

export function safeConfigPath(value: string) {
  if (!value.startsWith("/app/configurar/")) return "";
  if (value.length > 180 || /[?#\\\s]/.test(value) || value.includes("//") || value.includes("..")) return "";
  return value;
}
