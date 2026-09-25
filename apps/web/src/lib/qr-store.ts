import catalog from "../../../../data/qrs.json";

export type QrItem = { id: string; title: string; url: string };

const KEY = "nfs-qrs";

export function slugFromTitle(title: string): string {
  return (
    title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48) || "qr"
  );
}

export function defaultQrs(): QrItem[] {
  return (catalog as { title: string; url: string }[]).map((qr) => ({
    id: slugFromTitle(qr.title),
    title: qr.title,
    url: qr.url,
  }));
}

export function loadQrs(): QrItem[] {
  if (typeof window === "undefined") return defaultQrs();
  const raw = window.localStorage.getItem(KEY);
  if (!raw) return defaultQrs();
  try {
    const parsed = JSON.parse(raw) as QrItem[];
    if (!Array.isArray(parsed)) return defaultQrs();
    return parsed.filter((qr) => qr.id && qr.title && qr.url);
  } catch {
    return defaultQrs();
  }
}

export function saveQrs(items: QrItem[]) {
  window.localStorage.setItem(KEY, JSON.stringify(items));
}
