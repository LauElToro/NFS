"use client";

import { useEffect, useState } from "react";

type Unit = { cartelId: string; publicPath: string; code: string };
type Batch = { id: string; name: string; quantity: number; createdAt: string };
type Row = {
  id: string;
  cartelId: string;
  publicPath: string;
  status: string;
  statusLabel: string;
  createdAt: string;
  activatedAt?: string;
  batchId: string;
  batchName: string;
  destinationUrl: string;
};

const PRESETS = [1, 5, 10, 25, 50, 75, 100];

function toast(message: string, tone: "ok" | "danger" | "warn" = "ok") {
  window.dispatchEvent(new CustomEvent("nfs-toast", { detail: { message, tone } }));
}

function csv(units: Unit[], batch: string) {
  const lines = ["cartel,url_permanente,codigo_activacion,lote"];
  for (const unit of units) {
    lines.push([unit.cartelId, unit.publicPath, unit.code, batch].map((value) => `"${value.replace(/"/g, '""')}"`).join(","));
  }
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `activaciones-${batch || "lote"}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function ActivationsPanel() {
  const [quantity, setQuantity] = useState(10);
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [creating, setCreating] = useState(false);
  const [fresh, setFresh] = useState<{ name: string; units: Unit[] } | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [batch, setBatch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const params = new URLSearchParams({ q: query, status, batch, from, to });
    const res = await fetch(`/api/activations?${params.toString()}`);
    const data = (await res.json().catch(() => null)) as { codes?: Row[]; batches?: Batch[]; error?: string } | null;
    if (!res.ok || !data?.codes || !data.batches) {
      setError(data?.error || "No se pudieron cargar las activaciones");
      setReady(true);
      return;
    }
    setRows(data.codes);
    setBatches(data.batches);
    setError("");
    setReady(true);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 200);
    return () => window.clearTimeout(timer);
  }, [query, status, batch, from, to]);

  async function createBatch(event: React.FormEvent) {
    event.preventDefault();
    setCreating(true);
    const res = await fetch("/api/activations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ quantity, name, notes }),
    });
    const data = (await res.json().catch(() => null)) as { error?: string; name?: string; units?: Unit[] } | null;
    setCreating(false);
    if (!res.ok || !data?.units) {
      toast(data?.error || "No se pudo generar el lote", "danger");
      return;
    }
    setFresh({ name: data.name || name || "Lote", units: data.units });
    toast("Códigos generados. Descargalos ahora: no se vuelven a mostrar.");
    await load();
  }

  async function update(id: string, action: "revocar" | "anular") {
    const warning = action === "revocar"
      ? "¿Revocar este código? No va a poder activarse."
      : "¿Anular este código? El cartel deja de redirigir y el código no se puede usar.";
    if (!window.confirm(warning)) return;
    const res = await fetch(`/api/activations/${id}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    if (!res.ok) {
      toast(data?.error || "No se pudo actualizar", "danger");
      return;
    }
    toast(action === "revocar" ? "Código revocado" : "Código anulado");
    await load();
  }

  return (
    <div className="stack">
      <div>
        <h1 className="page-title">Activaciones</h1>
        <p className="page-lead muted">Generá un código de un solo uso para cada cartel de Mercado Libre. El NFC y el QR usan la URL permanente.</p>
      </div>
      <form className="card-panel stack" onSubmit={(event) => void createBatch(event)}>
        <h2 style={{ margin: 0 }}>Nuevo lote</h2>
        <div className="toolbar">
          {PRESETS.map((preset) => (
            <button key={preset} className={`btn ${quantity === preset ? "" : "secondary"}`} type="button" onClick={() => setQuantity(preset)}>
              {preset === 1 ? "1" : `x${preset}`}
            </button>
          ))}
        </div>
        <div className="toolbar">
          <label className="label" style={{ margin: 0 }}>
            Cantidad
            <input className="input" type="number" min={1} max={100} value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} />
          </label>
          <label className="label" style={{ margin: 0, flex: "1 1 220px" }}>
            Nombre del lote
            <input className="input" value={name} maxLength={80} placeholder="Pedido Mercado Libre" onChange={(event) => setName(event.target.value)} />
          </label>
        </div>
        <label className="label">
          Notas
          <input className="input" value={notes} maxLength={300} onChange={(event) => setNotes(event.target.value)} />
        </label>
        <button className="btn" type="submit" disabled={creating} aria-busy={creating}>Generar códigos</button>
      </form>
      {fresh ? (
        <section className="card-panel stack activation-sheet">
          <h2 style={{ margin: 0 }}>Códigos de {fresh.name}</h2>
          <p style={{ color: "var(--warn)", margin: 0 }}>Estos códigos se muestran una sola vez. Descargá el CSV o imprimí la hoja antes de salir.</p>
          <div className="toolbar no-print">
            <button className="btn" type="button" onClick={() => csv(fresh.units, fresh.name)}>Descargar CSV</button>
            <button className="btn secondary" type="button" onClick={() => window.print()}>Imprimir hoja</button>
          </div>
          <div className="activation-grid">
            {fresh.units.map((unit) => (
              <article key={unit.cartelId} className="activation-ticket">
                <strong>ReviewsGO</strong>
                <span>{unit.cartelId}</span>
                <b>{unit.code}</b>
                <small>{unit.publicPath}</small>
              </article>
            ))}
          </div>
        </section>
      ) : null}
      <div className="toolbar no-print">
        <label className="label" style={{ margin: 0, flex: "1 1 180px" }}>
          Buscar
          <input className="input" value={query} placeholder="Cartel, lote o URL pública" onChange={(event) => setQuery(event.target.value)} />
        </label>
        <label className="label" style={{ margin: 0 }}>
          Estado
          <select className="input" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">Todos</option>
            <option value="pendiente">Pendiente de activación</option>
            <option value="activado">Activado</option>
            <option value="revocado">Revocado</option>
            <option value="anulado">Anulado</option>
          </select>
        </label>
        <label className="label" style={{ margin: 0 }}>
          Lote
          <select className="input" value={batch} onChange={(event) => setBatch(event.target.value)}>
            <option value="">Todos</option>
            {batches.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
        </label>
        <label className="label" style={{ margin: 0 }}>
          Desde
          <input className="input" type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
        </label>
        <label className="label" style={{ margin: 0 }}>
          Hasta
          <input className="input" type="date" value={to} onChange={(event) => setTo(event.target.value)} />
        </label>
      </div>
      {!ready ? <div className="skeleton lg" aria-busy="true" /> : null}
      {error ? <p style={{ color: "var(--danger)" }}>{error}</p> : null}
      {ready && !error && rows.length === 0 ? (
        <div className="empty-state card-panel">
          <h2>No hay códigos para mostrar</h2>
          <p className="muted">Generá un lote para empezar a preparar pedidos.</p>
        </div>
      ) : null}
      <div className="stack no-print">
        {rows.map((row) => (
          <article key={row.id} className="card-panel stack" style={{ gap: "0.35rem" }}>
            <strong>{row.cartelId}</strong>
            <p className="muted" style={{ margin: 0 }}>{row.statusLabel} · {row.batchName} · {new Date(row.createdAt).toLocaleDateString("es-AR")}</p>
            <p className="muted" style={{ margin: 0 }}>{row.publicPath}{row.destinationUrl ? ` · ${row.destinationUrl}` : ""}</p>
            <div className="toolbar">
              {row.status === "pendiente" ? <button className="btn secondary" type="button" onClick={() => void update(row.id, "revocar")}>Revocar</button> : null}
              {row.status === "pendiente" || row.status === "activado" || row.status === "reservado" ? (
                <button className="btn danger" type="button" onClick={() => void update(row.id, "anular")}>Anular</button>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
