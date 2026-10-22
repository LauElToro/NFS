"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type FolderSummary = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  count: number;
};

function toast(message: string, tone: "ok" | "danger" | "warn" = "ok") {
  window.dispatchEvent(new CustomEvent("nfs-toast", { detail: { message, tone } }));
}

function formatWhen(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" });
}

export function FolderBoard() {
  const [folders, setFolders] = useState<FolderSummary[]>([]);
  const [query, setQuery] = useState("");
  const [name, setName] = useState("");
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [renameId, setRenameId] = useState("");
  const [renameValue, setRenameValue] = useState("");

  async function load(search = query) {
    const res = await fetch(`/api/folders?q=${encodeURIComponent(search)}`);
    const data = (await res.json().catch(() => null)) as FolderSummary[] | { error?: string } | null;
    if (!res.ok || !Array.isArray(data)) {
      setError(!Array.isArray(data) && data?.error ? data.error : "No se pudieron cargar las carpetas");
      setReady(true);
      return;
    }
    setFolders(data);
    setError("");
    setReady(true);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void load(query), 180);
    return () => window.clearTimeout(timer);
  }, [query]);

  async function createFolder(event: React.FormEvent) {
    event.preventDefault();
    setCreating(true);
    const res = await fetch("/api/folders", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    setCreating(false);
    if (!res.ok) {
      toast(data?.error || "No se pudo crear la carpeta", "danger");
      return;
    }
    setName("");
    toast("Carpeta creada");
    await load();
  }

  async function rename(id: string) {
    const res = await fetch(`/api/folders/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: renameValue }),
    });
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    if (!res.ok) {
      toast(data?.error || "No se pudo cambiar el nombre", "danger");
      return;
    }
    setRenameId("");
    toast("Nombre actualizado");
    await load();
  }

  async function remove(folder: FolderSummary) {
    if (!window.confirm(`¿Eliminar la carpeta “${folder.name}”? Los QR que contiene siguen en el inventario.`)) return;
    const res = await fetch(`/api/folders/${folder.id}`, { method: "DELETE" });
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    if (!res.ok) {
      toast(data?.error || "No se pudo eliminar la carpeta", "danger");
      return;
    }
    toast("Carpeta eliminada");
    await load();
  }

  return (
    <div className="stack">
      <div>
        <h1 className="page-title">Carpetas</h1>
        <p className="page-lead muted">Organizá tus QR por cliente, comercio o proyecto. Cada cuenta ve solo sus carpetas.</p>
      </div>
      <form className="card-panel" style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "end" }} onSubmit={(event) => void createFolder(event)}>
        <label className="label" style={{ flex: "1 1 220px", margin: 0 }}>
          Nueva carpeta
          <input className="input" value={name} maxLength={80} placeholder="Cliente Juan" onChange={(event) => setName(event.target.value)} />
        </label>
        <button className="btn" type="submit" disabled={creating || !name.trim()} aria-busy={creating}>
          Crear carpeta
        </button>
      </form>
      <label className="label">
        Buscar carpeta
        <input className="input" value={query} placeholder="Nombre de la carpeta" onChange={(event) => setQuery(event.target.value)} />
      </label>
      {!ready ? (
        <div className="folder-grid" aria-busy="true" aria-label="Cargando carpetas">
          <div className="skeleton lg" />
          <div className="skeleton lg" />
        </div>
      ) : null}
      {error ? <p style={{ color: "var(--danger)" }}>{error}</p> : null}
      {ready && !error && folders.length === 0 ? (
        <div className="empty-state card-panel">
          <h2>{query.trim() ? "No hay carpetas con ese nombre" : "Todavía no hay carpetas"}</h2>
          <p className="muted">Creá una carpeta o seleccioná QR en el listado y usá Organizar en carpeta.</p>
        </div>
      ) : null}
      <div className="folder-grid">
        {folders.map((folder) => (
          <article key={folder.id} className="card-panel folder-card stack">
            <div className="folder-heading">
              <span className="folder-icon" aria-hidden>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M3 7h6l2 2h10v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              {renameId === folder.id ? (
                <input className="input" value={renameValue} maxLength={80} onChange={(event) => setRenameValue(event.target.value)} />
              ) : (
                <h2>{folder.name}</h2>
              )}
            </div>
            <p className="muted" style={{ margin: 0 }}>
              {folder.count} QR{folder.updatedAt ? ` · ${formatWhen(folder.updatedAt)}` : ""}
            </p>
            <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
              <Link className="btn" href={`/app/carpetas/${folder.id}`}>
                Abrir
              </Link>
              {renameId === folder.id ? (
                <>
                  <button className="btn secondary" type="button" onClick={() => void rename(folder.id)}>
                    Guardar
                  </button>
                  <button className="btn secondary" type="button" onClick={() => setRenameId("")}>
                    Cancelar
                  </button>
                </>
              ) : (
                <button
                  className="btn secondary"
                  type="button"
                  onClick={() => {
                    setRenameId(folder.id);
                    setRenameValue(folder.name);
                  }}
                >
                  Renombrar
                </button>
              )}
              <button className="btn danger" type="button" onClick={() => void remove(folder)}>
                Eliminar
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
