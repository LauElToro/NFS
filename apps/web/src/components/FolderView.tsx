"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { pngFileName, zipStore } from "@/lib/qr-zip";
import { SETUP_LABELS, posterSetupState } from "@/lib/poster-state";
import { STATUS_LABELS, type PosterStatus, type QrItem } from "@/lib/qr-store";

type FolderSummary = { id: string; name: string; count: number; updatedAt: string };

const QR_PNG = { width: 512, margin: 2 };

function zipName(name: string) {
  const clean = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Za-z0-9_-]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 40);
  return `QR_${clean || "carpeta"}.zip`;
}

function toast(message: string, tone: "ok" | "danger" | "warn" = "ok") {
  window.dispatchEvent(new CustomEvent("nfs-toast", { detail: { message, tone } }));
}

function publicSlug(item: QrItem) {
  return item.token || item.uniqueCode || item.id;
}

function posterLabel(item: QrItem) {
  return (item.title || "").trim() || item.cartelId || item.uniqueCode || item.id;
}

async function qrPngBytes(slug: string) {
  const dataUrl = await QRCode.toDataURL(`${window.location.origin}/r/${slug}`, QR_PNG);
  const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

async function downloadPng(item: QrItem) {
  const dataUrl = await QRCode.toDataURL(`${window.location.origin}/r/${publicSlug(item)}`, QR_PNG);
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = `cartel-${publicSlug(item)}.png`;
  link.click();
}

async function downloadZip(items: QrItem[], fileName: string) {
  const used = new Set<string>();
  const files: { name: string; data: Uint8Array }[] = [];
  for (const item of items) {
    files.push({
      name: pngFileName(posterLabel(item), used, item.cartelId || item.uniqueCode || item.id),
      data: await qrPngBytes(publicSlug(item)),
    });
  }
  const blob = new Blob([zipStore(files)], { type: "application/zip" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
  return files.length;
}

export function FolderView({ folderId }: { folderId: string }) {
  const [folder, setFolder] = useState<FolderSummary | null>(null);
  const [posters, setPosters] = useState<QrItem[]>([]);
  const [query, setQuery] = useState("");
  const [setupFilter, setSetupFilter] = useState("todos");
  const [selected, setSelected] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const [inventory, setInventory] = useState<QrItem[]>([]);
  const [pickerQuery, setPickerQuery] = useState("");
  const [pickerIds, setPickerIds] = useState<string[]>([]);
  const [working, setWorking] = useState(false);
  const zipLock = useRef(false);

  async function load() {
    const res = await fetch(`/api/folders/${folderId}`);
    const data = (await res.json().catch(() => null)) as { folder?: FolderSummary; posters?: QrItem[]; error?: string } | null;
    if (!res.ok || !data?.folder || !data.posters) {
      setError(data?.error || "No se pudo abrir la carpeta");
      setReady(true);
      return;
    }
    setFolder(data.folder);
    setPosters(data.posters);
    setSelected((current) => current.filter((id) => data.posters?.some((item) => item.id === id)));
    setError("");
    setReady(true);
  }

  useEffect(() => {
    void load();
  }, [folderId]);

  const visible = posters.filter((item) => {
    const text = `${item.cartelId || ""} ${item.uniqueCode || ""} ${item.id} ${item.title || ""}`.toLowerCase();
    if (query.trim() && !text.includes(query.trim().toLowerCase())) return false;
    const setup = posterSetupState(item);
    if (setupFilter === "pendiente" && setup !== "pendiente") return false;
    if (setupFilter === "listo" && setup === "pendiente") return false;
    return true;
  });
  const visibleIds = visible.map((item) => item.id);
  const allVisible = visibleIds.length > 0 && visibleIds.every((id) => selected.includes(id));

  async function download(items: QrItem[], fileName: string) {
    if (items.length === 0 || zipLock.current) return;
    zipLock.current = true;
    setWorking(true);
    try {
      const count = await downloadZip(items, fileName);
      toast(count === 1 ? "QR descargado" : `Se descargaron ${count} QR`);
    } catch {
      toast("No se pudo generar el ZIP", "danger");
    } finally {
      zipLock.current = false;
      setWorking(false);
    }
  }

  async function removeSelected() {
    if (!window.confirm("¿Quitar los QR seleccionados de esta carpeta? No se eliminan del inventario.")) return;
    setWorking(true);
    const res = await fetch(`/api/folders/${folderId}/items`, {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ids: selected }),
    });
    const data = (await res.json().catch(() => null)) as { error?: string; removed?: number } | null;
    setWorking(false);
    if (!res.ok) {
      toast(data?.error || "No se pudieron quitar", "danger");
      return;
    }
    toast(data?.removed ? "QR quitados de la carpeta" : "Esos QR no estaban en la carpeta", data?.removed ? "ok" : "warn");
    setSelected([]);
    await load();
  }

  async function openPicker() {
    setAdding(true);
    setPickerIds([]);
    setPickerQuery("");
    const res = await fetch("/api/qrs");
    const data = (await res.json().catch(() => null)) as QrItem[] | { error?: string } | null;
    if (!res.ok || !Array.isArray(data)) {
      toast(!Array.isArray(data) && data?.error ? data.error : "No se pudieron cargar los QR", "danger");
      setAdding(false);
      return;
    }
    setInventory(data);
  }

  async function addPicked() {
    setWorking(true);
    const res = await fetch(`/api/folders/${folderId}/items`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ids: pickerIds }),
    });
    const data = (await res.json().catch(() => null)) as { error?: string; added?: number } | null;
    setWorking(false);
    if (!res.ok) {
      toast(data?.error || "No se pudieron agregar", "danger");
      return;
    }
    toast(data?.added ? `Se agregaron ${data.added} QR` : "Esos QR ya estaban en la carpeta", data?.added ? "ok" : "warn");
    setAdding(false);
    await load();
  }

  const inside = new Set(posters.map((item) => item.id));
  const choices = inventory
    .filter((item) => !inside.has(item.id))
    .filter((item) => {
      const text = `${item.cartelId || ""} ${item.uniqueCode || ""} ${item.title || ""}`.toLowerCase();
      return !pickerQuery.trim() || text.includes(pickerQuery.trim().toLowerCase());
    })
    .slice(0, 40);

  if (!ready) {
    return (
      <div className="stack" aria-busy="true">
        <div className="skeleton" style={{ width: "14rem", height: "1.8rem" }} />
        <div className="skeleton lg" />
      </div>
    );
  }

  if (!folder) {
    return (
      <div className="stack">
        <h1 className="page-title">Carpeta no disponible</h1>
        <p style={{ color: "var(--danger)" }}>{error || "No encontramos esa carpeta"}</p>
        <Link className="btn secondary" href="/app/carpetas">
          Volver a carpetas
        </Link>
      </div>
    );
  }

  return (
    <div className="stack">
      <div>
        <Link className="muted" href="/app/carpetas">
          Volver a carpetas
        </Link>
        <h1 className="page-title">{folder.name}</h1>
        <p className="page-lead muted">{folder.count} QR en esta carpeta. Quitarlos de acá no los borra.</p>
      </div>
      <div className="toolbar">
        <label className="label" style={{ flex: "1 1 200px", margin: 0 }}>
          Buscar en la carpeta
          <input className="input" value={query} placeholder="Código o comercio" onChange={(event) => setQuery(event.target.value)} />
        </label>
        <label className="label" style={{ margin: 0 }}>
          Estado
          <select className="input" value={setupFilter} onChange={(event) => setSetupFilter(event.target.value)}>
            <option value="todos">Todos</option>
            <option value="pendiente">Sin configurar</option>
            <option value="listo">Con destino</option>
          </select>
        </label>
      </div>
      <div className="toolbar">
        <button className="btn secondary" type="button" onClick={() => setSelected(allVisible ? selected.filter((id) => !visibleIds.includes(id)) : [...new Set([...selected, ...visibleIds])])}>
          {allVisible ? "Deseleccionar visibles" : "Seleccionar visibles"}
        </button>
        <button className="btn secondary" type="button" onClick={() => void openPicker()}>
          Agregar QR
        </button>
        <button className="btn" type="button" disabled={working || selected.length === 0} onClick={() => void download(posters.filter((item) => selected.includes(item.id)), zipName(folder.name))}>
          Descargar seleccionados ({selected.length})
        </button>
        <button className="btn secondary" type="button" disabled={working || posters.length === 0} onClick={() => void download(posters, zipName(folder.name))}>
          Descargar carpeta
        </button>
        <button className="btn danger" type="button" disabled={working || selected.length === 0} onClick={() => void removeSelected()}>
          Quitar de la carpeta
        </button>
      </div>
      {visible.length === 0 ? (
        <div className="empty-state card-panel">
          <h2>{posters.length === 0 ? "Esta carpeta está vacía" : "Ningún QR coincide"}</h2>
          <p className="muted">Agregá QR existentes. También entran los que todavía no tienen destino.</p>
        </div>
      ) : null}
      <div className="qr-admin-grid">
        {visible.map((item) => {
          const setup = posterSetupState(item);
          const picked = selected.includes(item.id);
          return (
            <article key={item.id} className={`card-panel qr-card stack${picked ? " picked" : ""}`} style={{ margin: 0 }}>
              <label style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <input
                  type="checkbox"
                  checked={picked}
                  onChange={(event) =>
                    setSelected((current) => (event.target.checked ? [...current, item.id] : current.filter((id) => id !== item.id)))
                  }
                />
                <strong>{item.cartelId || item.uniqueCode || item.id}</strong>
              </label>
              <p className="muted" style={{ margin: 0 }}>{item.title || "Sin comercio"}</p>
              <p style={{ margin: 0 }}>
                <span className={`status-pill status-${item.status || "disponible"}`}>{STATUS_LABELS[(item.status || "disponible") as PosterStatus]}</span>
              </p>
              <p className="muted" style={{ margin: 0 }}>{SETUP_LABELS[setup]}</p>
              <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                <Link className="btn secondary" href={`/app/configurar/${item.id}`}>
                  Configurar
                </Link>
                <button className="btn secondary" type="button" onClick={() => void downloadPng(item)}>
                  PNG
                </button>
              </div>
            </article>
          );
        })}
      </div>
      {adding ? (
        <div className="modal-root">
          <button className="drawer-backdrop" type="button" aria-label="Cerrar" onClick={() => setAdding(false)} />
          <div className="modal-card card-panel stack" role="dialog" aria-modal="true" aria-labelledby="agregar-qr">
            <h2 id="agregar-qr" style={{ margin: 0 }}>Agregar QR existentes</h2>
            <input className="input" value={pickerQuery} placeholder="Buscar código o comercio" onChange={(event) => setPickerQuery(event.target.value)} />
            <div className="picker-list">
              {choices.length === 0 ? <p className="muted">No hay QR disponibles para agregar.</p> : null}
              {choices.map((item) => (
                <label key={item.id} className="picker-row">
                  <input
                    type="checkbox"
                    checked={pickerIds.includes(item.id)}
                    onChange={(event) =>
                      setPickerIds((current) => (event.target.checked ? [...current, item.id] : current.filter((id) => id !== item.id)))
                    }
                  />
                  <span>
                    <strong>{item.cartelId || item.uniqueCode || item.id}</strong>
                    <span className="muted"> · {item.title || "Sin comercio"} · {item.url ? "Con destino" : "Sin configurar"}</span>
                  </span>
                </label>
              ))}
            </div>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <button className="btn" type="button" disabled={working || pickerIds.length === 0} onClick={() => void addPicked()}>
                Agregar {pickerIds.length || ""}
              </button>
              <button className="btn secondary" type="button" onClick={() => setAdding(false)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
