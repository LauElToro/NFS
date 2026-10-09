"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { pngFileName, zipStore } from "@/lib/qr-zip";
import { DESTINATION_LABELS, type DestinationType, type QrItem } from "@/lib/qr-store";
import { SETUP_LABELS, posterSetupState, type SetupState } from "@/lib/poster-state";

type Summary = { total: number; configurados: number; pendientes: number; errores: number; sinVerificar: number; status: string };
type ClientInfo = { id: string; name: string; notes: string; createdAt: string; history: { at: string; byName: string; change: string }[] };
type Other = { id: string; name: string };

const QR_PNG = { width: 512, margin: 2 };

function toast(message: string, tone: "ok" | "danger" | "warn" = "ok") {
  window.dispatchEvent(new CustomEvent("nfs-toast", { detail: { message, tone } }));
}

function publicSlug(item: QrItem) {
  return item.token || item.uniqueCode || item.id;
}

function formatDate(value?: string) {
  if (!value) return "Sin fecha";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Sin fecha" : date.toLocaleString("es-AR");
}

function stateClass(state: SetupState) {
  if (state === "funcionando") return "status-disponible";
  if (state === "pendiente") return "status-configurando";
  if (state === "error") return "status-bloqueado";
  return "status-asignado";
}

async function qrPngBytes(slug: string) {
  const dataUrl = await QRCode.toDataURL(`${window.location.origin}/r/${slug}`, QR_PNG);
  const binary = atob(dataUrl.slice(dataUrl.indexOf(",") + 1));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function downloadOne(item: QrItem) {
  const dataUrl = await QRCode.toDataURL(`${window.location.origin}/r/${publicSlug(item)}`, QR_PNG);
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = pngFileName(item.cartelId || item.uniqueCode || item.id, new Set());
  link.click();
}

export function ClientFolderView({ clientId }: { clientId: string }) {
  const [client, setClient] = useState<ClientInfo | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [items, setItems] = useState<QrItem[]>([]);
  const [others, setOthers] = useState<Other[]>([]);
  const [available, setAvailable] = useState(0);
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("todos");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [total, setTotal] = useState(0);
  const [count, setCount] = useState(10);
  const [selected, setSelected] = useState<string[]>([]);
  const [targetId, setTargetId] = useState("");
  const [reload, setReload] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const profileKey = useRef("");

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ q: query, filter, page: String(page), pageSize: String(pageSize) });
    fetch(`/api/clients/${clientId}?${params}`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error("No se pudo abrir la carpeta");
        return (await res.json()) as {
          client: ClientInfo;
          summary: Summary;
          items: QrItem[];
          total: number;
          page: number;
          available: number;
          others: Other[];
        };
      })
      .then((data) => {
        setClient(data.client);
        const key = `${data.client.id}:${reload}`;
        if (profileKey.current !== key) {
          profileKey.current = key;
          setName(data.client.name);
          setNotes(data.client.notes);
        }
        setSummary(data.summary);
        setItems(data.items);
        setTotal(data.total);
        setAvailable(data.available);
        setOthers(data.others);
        if (data.page !== page) setPage(data.page);
        setError("");
      })
      .catch((reason: Error) => {
        if (reason.name !== "AbortError") setError(reason.message);
      });
    return () => controller.abort();
  }, [clientId, query, filter, page, pageSize, reload]);

  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const pages = Math.max(1, Math.ceil(total / pageSize));

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    if (!window.confirm("¿Guardar el nombre y las notas de este negocio?")) return;
    setBusy(true);
    const res = await fetch(`/api/clients/${clientId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, notes }),
    });
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    setBusy(false);
    if (!res.ok) {
      toast(data?.error || "No se pudo guardar", "danger");
      return;
    }
    toast("Carpeta actualizada");
    setReload((value) => value + 1);
  }

  async function assign() {
    const amount = Math.min(100, Math.max(1, Math.floor(count)));
    if (!window.confirm(`Se van a asignar ${amount} carteles existentes a esta carpeta. No se crean códigos nuevos.`)) return;
    setBusy(true);
    const res = await fetch(`/api/clients/${clientId}/assign`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ count: amount }),
    });
    const data = (await res.json().catch(() => null)) as { error?: string; assigned?: number } | null;
    setBusy(false);
    if (!res.ok) {
      toast(data?.error || "No se pudo asignar", "danger");
      return;
    }
    toast(data?.assigned ? `Se asignaron ${data.assigned} carteles` : "No hay carteles disponibles para asignar", data?.assigned ? "ok" : "warn");
    setReload((value) => value + 1);
  }

  async function verify(ids: string[]) {
    if (ids.length === 0) {
      toast("Elegí al menos un cartel", "warn");
      return;
    }
    setBusy(true);
    const res = await fetch(`/api/clients/${clientId}/verify`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ids: ids.slice(0, 25) }),
    });
    const data = (await res.json().catch(() => null)) as { error?: string; checked?: number } | null;
    setBusy(false);
    if (!res.ok) {
      toast(data?.error || "No se pudo verificar", "danger");
      return;
    }
    toast(
      data?.checked ? `Se comprobaron ${data.checked} destinos` : "No había destinos guardados para comprobar",
      data?.checked ? "ok" : "warn",
    );
    setReload((value) => value + 1);
  }

  async function moveSelected() {
    if (!targetId || selected.length === 0) return;
    const target = others.find((item) => item.id === targetId);
    if (!window.confirm(`¿Mover ${selected.length} cartel${selected.length === 1 ? "" : "es"} a ${target?.name || "otro negocio"}? Las URLs no se borran.`)) return;
    setBusy(true);
    const res = await fetch(`/api/clients/${clientId}/move`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ targetId, ids: selected }),
    });
    const data = (await res.json().catch(() => null)) as { error?: string; moved?: number } | null;
    setBusy(false);
    if (!res.ok) {
      toast(data?.error || "No se pudo reasignar", "danger");
      return;
    }
    setSelected([]);
    toast(`Se movieron ${data?.moved ?? 0} carteles`);
    setReload((value) => value + 1);
  }

  async function downloadSelected() {
    const chosen = items.filter((item) => selected.includes(item.id));
    if (chosen.length === 0) return;
    setBusy(true);
    try {
      const used = new Set<string>();
      const files = [];
      for (const item of chosen) {
        files.push({
          name: pngFileName(item.cartelId || item.uniqueCode || item.id, used),
          data: await qrPngBytes(publicSlug(item)),
        });
      }
      const blob = new Blob([zipStore(files)], { type: "application/zip" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `QR_${client?.id || "carpeta"}_${files.length}.zip`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      toast("No se pudo descargar el ZIP", "danger");
    } finally {
      setBusy(false);
    }
  }

  async function copyLink(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast("Enlace copiado");
    } catch {
      toast("No se pudo copiar", "danger");
    }
  }

  if (error && !client) return <p style={{ color: "var(--danger)" }}>{error}</p>;
  if (!client || !summary) return <p className="muted">Cargando carpeta...</p>;

  return (
    <div className="stack" style={{ gap: "1.25rem" }}>
      <div>
        <Link className="muted" href="/app/clientes">← Clientes y negocios</Link>
        <h1 style={{ margin: "0.35rem 0" }}>{client.name}</h1>
        <p className="muted" style={{ margin: 0 }}>{client.id} · Creada el {formatDate(client.createdAt)}</p>
      </div>

      <section className="stat-grid" aria-label="Resumen de la carpeta">
        <article className="card-panel stat-card"><div className="stat-value">{summary.total}</div><div className="stat-label">Carteles</div></article>
        <article className="card-panel stat-card"><div className="stat-value">{summary.configurados}</div><div className="stat-label">Funcionando</div></article>
        <article className="card-panel stat-card"><div className="stat-value">{summary.pendientes}</div><div className="stat-label">Pendientes</div></article>
        <article className="card-panel stat-card"><div className="stat-value">{summary.errores}</div><div className="stat-label">Con error</div></article>
        <article className="card-panel stat-card"><div className="stat-value">{summary.sinVerificar}</div><div className="stat-label">Sin verificar</div></article>
        <article className="card-panel stat-card"><div className="stat-label">Estado general</div><strong>{summary.status}</strong></article>
      </section>

      <form className="card-panel stack" onSubmit={(event) => void saveProfile(event)}>
        <h2 style={{ margin: 0 }}>Datos del negocio</h2>
        <label className="label">
          Nombre
          <input className="input" value={name} onChange={(event) => setName(event.target.value)} required />
        </label>
        <label className="label">
          Notas internas
          <textarea className="input" value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} />
        </label>
        <button className="btn" type="submit" disabled={busy}>Guardar</button>
        {client.history.length > 0 ? (
          <div className="stack">
            <strong>Historial</strong>
            {client.history.slice(0, 6).map((entry) => (
              <p key={`${entry.at}-${entry.change}`} className="muted" style={{ margin: 0 }}>
                {formatDate(entry.at)} · {entry.change} · {entry.byName}
              </p>
            ))}
          </div>
        ) : null}
      </form>

      <section className="card-panel stack">
        <h2 style={{ margin: 0 }}>Asignar carteles</h2>
        <p className="muted" style={{ margin: 0 }}>
          Hay {available.toLocaleString("es-AR")} carteles disponibles. Se usan los que ya están impresos.
        </p>
        <label className="label">
          Cantidad
          <input className="input" type="number" min={1} max={100} value={count} onChange={(event) => setCount(Number(event.target.value))} />
        </label>
        <button className="btn" type="button" disabled={busy || available === 0} onClick={() => void assign()}>Asignar carteles</button>
      </section>

      <div className="filters">
        <label className="label">
          Buscar cartel
          <input className="input" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Código del cartel" />
        </label>
        <label className="label">
          Estado
          <select className="input" value={filter} onChange={(event) => { setFilter(event.target.value); setPage(1); }}>
            <option value="todos">Todos</option>
            <option value="pendientes">Pendientes</option>
            <option value="errores">Con error</option>
            <option value="configurados">Funcionando</option>
          </select>
        </label>
        <label className="label">
          Por página
          <select className="input" value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }}>
            {[12, 24, 48].map((size) => <option key={size} value={size}>{size}</option>)}
          </select>
        </label>
      </div>

      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
        <button className="btn secondary" type="button" onClick={() => setSelected(items.map((item) => item.id))}>Seleccionar esta página</button>
        <button className="btn secondary" type="button" onClick={() => setSelected([])}>Deseleccionar</button>
        <span className="muted">{selected.length} seleccionados</span>
        <button className="btn secondary" type="button" disabled={busy || selected.length === 0} onClick={() => void verify(selected)}>Verificar seleccionados</button>
        <button className="btn secondary" type="button" disabled={busy || items.length === 0} onClick={() => void verify(items.map((item) => item.id))}>Verificar esta página</button>
        <button className="btn" type="button" disabled={busy || selected.length === 0} onClick={() => void downloadSelected()}>Descargar seleccionados ({selected.length})</button>
      </div>
      {others.length > 0 ? (
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "end" }}>
          <label className="label" style={{ flex: "1 1 220px", margin: 0 }}>
            Reasignar a otro negocio
            <select className="input" value={targetId} onChange={(event) => setTargetId(event.target.value)}>
              <option value="">Elegir carpeta</option>
              {others.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
          <button className="btn secondary" type="button" disabled={busy || !targetId || selected.length === 0} onClick={() => void moveSelected()}>
            Reasignar selección
          </button>
        </div>
      ) : null}

      {items.length === 0 ? <div className="empty-state card-panel"><h2>Esta carpeta no tiene carteles para mostrar</h2></div> : null}
      <div className="qr-admin-grid">
        {items.map((item) => {
          const state = posterSetupState(item);
          const slug = publicSlug(item);
          const destination = (item.url || "").trim();
          const type = DESTINATION_LABELS[(item.destinationType as DestinationType) || "otro"] ?? "Otro enlace";
          return (
            <article key={item.id} className="card-panel qr-card stack" style={{ margin: 0 }}>
              <label style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <input
                  type="checkbox"
                  checked={selected.includes(item.id)}
                  onChange={(event) => setSelected((current) => event.target.checked ? [...current, item.id] : current.filter((id) => id !== item.id))}
                />
                <strong>{item.cartelId || item.id}</strong>
              </label>
              <span className="muted">{item.uniqueCode || item.id}</span>
              <span>{type}</span>
              <span className={`status-pill ${stateClass(state)}`}>{SETUP_LABELS[state]}</span>
              <span className="muted">{destination || "Sin URL de destino"}</span>
              {item.lastCheck ? <span className="muted">{item.lastCheck.detail} · {formatDate(item.lastCheck.at)}</span> : null}
              <span className="muted">Último cambio: {formatDate(item.updatedAt)}</span>
              <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                <Link className="btn" href={`/app/configurar/${item.id}`}>Editar</Link>
                <button className="btn secondary" type="button" disabled={busy} onClick={() => void verify([item.id])}>Verificar</button>
                <a className="btn secondary" href={destination || `/r/${slug}`} target="_blank" rel="noreferrer">Probar</a>
                <button className="btn secondary" type="button" onClick={() => void copyLink(destination || `${window.location.origin}/r/${slug}`)}>Copiar enlace</button>
                <button className="btn secondary" type="button" onClick={() => void downloadOne(item)}>Descargar</button>
              </div>
            </article>
          );
        })}
      </div>
      <div className="pager">
        <p className="muted" style={{ margin: 0 }}>Mostrando {from.toLocaleString("es-AR")}–{to.toLocaleString("es-AR")} de {total.toLocaleString("es-AR")} carteles</p>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button className="btn secondary" type="button" disabled={page <= 1} onClick={() => setPage(page - 1)}>Página anterior</button>
          <button className="btn secondary" type="button" disabled={page >= pages} onClick={() => setPage(page + 1)}>Página siguiente</button>
        </div>
      </div>
    </div>
  );
}
