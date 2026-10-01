import catalog from "../../../../data/qrs.json";

export type DestinationType = "google" | "instagram" | "whatsapp" | "facebook" | "web" | "otro";

export const DESTINATION_LABELS: Record<DestinationType, string> = {
  google: "Google Reviews",
  instagram: "Instagram",
  whatsapp: "WhatsApp",
  facebook: "Facebook",
  web: "Sitio web",
  otro: "Otro enlace",
};

export const POSTER_STATUSES = [
  "disponible",
  "asignado",
  "enviado",
  "recibido",
  "configurando",
  "vendido",
  "activo",
  "bloqueado",
] as const;

export type PosterStatus = (typeof POSTER_STATUSES)[number];

export const STATUS_LABELS: Record<PosterStatus, string> = {
  disponible: "Disponible",
  asignado: "Asignado",
  enviado: "Enviado",
  recibido: "Recibido",
  configurando: "Configurando",
  vendido: "Vendido",
  activo: "Activo",
  bloqueado: "Bloqueado",
};

export type UrlChange = {
  at: string;
  from: string;
  to: string;
  byId: string;
  byName: string;
};

export type QrItem = {
  id: string;
  title: string;
  url: string;
  ownerId?: string;
  destinationType?: DestinationType;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
  ownerEmail?: string;
  ownerName?: string;
  cartelId?: string;
  uniqueCode?: string;
  status?: PosterStatus;
  assignedAt?: string;
  soldAt?: string;
  history?: UrlChange[];
};

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
