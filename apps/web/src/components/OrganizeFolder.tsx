"use client";

import { useEffect, useState } from "react";

type FolderSummary = { id: string; name: string; count: number };

function toast(message: string, tone: "ok" | "danger" | "warn" = "ok") {
  window.dispatchEvent(new CustomEvent("nfs-toast", { detail: { message, tone } }));
}

export function OrganizeFolder({ ids }: { ids: string[] }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string[]>([]);
  const [folders, setFolders] = useState<FolderSummary[]>([]);
  const [mode, setMode] = useState<"existente" | "nueva">("existente");
  const [folderId, setFolderId] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function show() {
    const chosen = [...ids];
    setDraft(chosen);
    setName("");
    setError("");
    setOpen(true);
    setLoading(true);
    const res = await fetch("/api/folders");
    const data = (await res.json().catch(() => null)) as FolderSummary[] | { error?: string } | null;
    setLoading(false);
    if (!res.ok || !Array.isArray(data)) {
      setFolders([]);
      setMode("nueva");
      setError(!Array.isArray(data) && data?.error ? data.error : "No se pudieron cargar las carpetas");
      return;
    }
    setFolders(data);
    setMode(data.length ? "existente" : "nueva");
    setFolderId(data[0]?.id || "");
  }

  async function confirm() {
    setWorking(true);
    setError("");
    const res =
      mode === "nueva"
        ? await fetch("/api/folders", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ name, qrIds: draft }),
          })
        : await fetch(`/api/folders/${folderId}/items`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ ids: draft }),
          });
    const data = (await res.json().catch(() => null)) as { error?: string; added?: number; skipped?: number } | null;
    setWorking(false);
    if (!res.ok) {
      setError(data?.error || "No se pudo organizar");
      return;
    }
    const added = data?.added ?? draft.length;
    const skipped = data?.skipped ?? 0;
    if (added === 0) toast("Esos QR ya estaban en la carpeta", "warn");
    else if (skipped > 0) toast(`Se agregaron ${added} QR. ${skipped} no se pudieron incluir.`, "warn");
    else toast(added === 1 ? "QR agregado a la carpeta" : `Se agregaron ${added} QR a la carpeta`);
    setOpen(false);
  }

  return (
    <>
      <button className="btn secondary" type="button" disabled={ids.length === 0} onClick={() => void show()}>
        Organizar en carpeta
      </button>
      {open ? (
        <div className="modal-root">
          <button className="drawer-backdrop" type="button" aria-label="Cerrar" onClick={() => setOpen(false)} />
          <div className="modal-card card-panel stack" role="dialog" aria-modal="true" aria-labelledby="organizar-titulo">
            <h2 id="organizar-titulo" style={{ margin: 0 }}>
              Organizar en carpeta
            </h2>
            <p className="muted" style={{ margin: 0 }}>
              {draft.length} QR seleccionado{draft.length === 1 ? "" : "s"}. El código, el destino y la URL no cambian.
            </p>
            {loading ? <p className="muted">Cargando carpetas…</p> : null}
            <label className="label">
              <span style={{ display: "flex", gap: "0.45rem", alignItems: "center" }}>
                <input type="radio" name="folder-mode" checked={mode === "existente"} disabled={folders.length === 0} onChange={() => setMode("existente")} />
                Carpeta existente
              </span>
              <select className="input" value={folderId} disabled={mode !== "existente" || folders.length === 0} onChange={(event) => setFolderId(event.target.value)}>
                {folders.length === 0 ? <option value="">Todavía no hay carpetas</option> : null}
                {folders.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.name} · {folder.count} QR
                  </option>
                ))}
              </select>
            </label>
            <label className="label">
              <span style={{ display: "flex", gap: "0.45rem", alignItems: "center" }}>
                <input type="radio" name="folder-mode" checked={mode === "nueva"} onChange={() => setMode("nueva")} />
                Carpeta nueva
              </span>
              <input
                className="input"
                value={name}
                disabled={mode !== "nueva"}
                maxLength={80}
                placeholder="Smoke Eat Burger"
                onChange={(event) => setName(event.target.value)}
              />
            </label>
            {error ? <p style={{ color: "var(--danger)", margin: 0 }}>{error}</p> : null}
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <button className="btn" type="button" disabled={working || (mode === "nueva" ? !name.trim() : !folderId)} aria-busy={working} onClick={() => void confirm()}>
                Guardar en la carpeta
              </button>
              <button className="btn secondary" type="button" onClick={() => setOpen(false)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
