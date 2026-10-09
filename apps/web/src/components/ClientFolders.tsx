"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type FolderCard = {
  id: string;
  name: string;
  notes: string;
  createdAt: string;
  total: number;
  configurados: number;
  pendientes: number;
  errores: number;
  sinVerificar: number;
  status: string;
};

function toast(message: string, tone: "ok" | "danger" | "warn" = "ok") {
  window.dispatchEvent(new CustomEvent("nfs-toast", { detail: { message, tone } }));
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("es-AR");
}

export function ClientFolders() {
  const [items, setItems] = useState<FolderCard[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("todos");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [total, setTotal] = useState(0);
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [creating, setCreating] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ q: query, filter, sort, page: String(page), pageSize: String(pageSize) });
    fetch(`/api/clients?${params}`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error("No se pudieron cargar los negocios");
        return (await res.json()) as { items: FolderCard[]; total: number; page: number };
      })
      .then((data) => {
        setItems(data.items);
        setTotal(data.total);
        if (data.page !== page) setPage(data.page);
        setError("");
      })
      .catch((reason: Error) => {
        if (reason.name !== "AbortError") setError(reason.message);
      })
      .finally(() => setReady(true));
    return () => controller.abort();
  }, [query, filter, sort, page, pageSize]);

  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const pages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="stack" style={{ gap: "1.25rem" }}>
      <div>
        <h1 style={{ margin: "0 0 0.35rem" }}>Clientes y negocios</h1>
        <p className="muted" style={{ margin: 0 }}>
          Cada negocio tiene su carpeta. Los carteles que ya existen se asignan ahí, sin generar códigos nuevos.
        </p>
      </div>

      <form
        className="card-panel stack"
        onSubmit={async (event) => {
          event.preventDefault();
          setCreating(true);
          const res = await fetch("/api/clients", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ name, notes }),
          });
          const data = (await res.json().catch(() => null)) as { error?: string; id?: string } | null;
          setCreating(false);
          if (!res.ok || !data?.id) {
            toast(data?.error || "No se pudo crear", "danger");
            return;
          }
          setName("");
          setNotes("");
          toast("Carpeta creada");
          window.location.href = `/app/clientes/${data.id}`;
        }}
      >
        <h2 style={{ margin: 0 }}>Crear cliente</h2>
        <label className="label">
          Nombre del negocio
          <input className="input" value={name} onChange={(event) => setName(event.target.value)} placeholder="Smoke Eat Burger" required />
        </label>
        <label className="label">
          Notas internas
          <textarea className="input" value={notes} onChange={(event) => setNotes(event.target.value)} rows={2} placeholder="Pedido, contacto o detalle de la configuración" />
        </label>
        <button className="btn" type="submit" disabled={creating} aria-busy={creating}>
          Crear cliente
        </button>
      </form>

      <div className="filters">
        <label className="label">
          Buscar
          <input className="input" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Negocio, identificador o código de cartel" />
        </label>
        <label className="label">
          Estado
          <select className="input" value={filter} onChange={(event) => { setFilter(event.target.value); setPage(1); }}>
            <option value="todos">Todos</option>
            <option value="pendientes">Con pendientes</option>
            <option value="errores">Con errores</option>
            <option value="configurados">Correctamente configurados</option>
          </select>
        </label>
        <label className="label">
          Orden
          <select className="input" value={sort} onChange={(event) => { setSort(event.target.value); setPage(1); }}>
            <option value="newest">Fecha más reciente</option>
            <option value="oldest">Fecha más antigua</option>
            <option value="count-desc">Más carteles</option>
            <option value="count-asc">Menos carteles</option>
          </select>
        </label>
        <label className="label">
          Por página
          <select className="input" value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }}>
            {[12, 24, 48].map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </label>
      </div>

      {error ? <p style={{ color: "var(--danger)" }}>{error}</p> : null}
      {ready && items.length === 0 ? (
        <div className="empty-state card-panel">
          <h2>No hay carpetas para mostrar</h2>
          <p className="muted">Creá un cliente o cambiá los filtros.</p>
        </div>
      ) : null}
      <div className="qr-admin-grid">
        {items.map((item) => (
          <Link key={item.id} href={`/app/clientes/${item.id}`} className="card-panel interactive qr-card stack" style={{ margin: 0, textDecoration: "none", color: "inherit" }}>
            <strong>{item.name}</strong>
            <span className="muted">{item.id}</span>
            <span>{item.total} cartel{item.total === 1 ? "" : "es"}</span>
            <span className={`status-pill ${item.errores ? "status-bloqueado" : item.pendientes ? "status-configurando" : item.status === "Configurado" ? "status-disponible" : "status-asignado"}`}>
              {item.status}
            </span>
            <span className="muted">{item.configurados} funcionando · {item.pendientes} pendientes · {item.errores} con error</span>
            <span className="muted">{formatDate(item.createdAt)}</span>
          </Link>
        ))}
      </div>
      <div className="pager">
        <p className="muted" style={{ margin: 0 }}>
          Mostrando {from.toLocaleString("es-AR")}–{to.toLocaleString("es-AR")} de {total.toLocaleString("es-AR")} negocios
        </p>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button className="btn secondary" type="button" disabled={page <= 1} onClick={() => setPage(page - 1)}>Página anterior</button>
          <button className="btn secondary" type="button" disabled={page >= pages} onClick={() => setPage(page + 1)}>Página siguiente</button>
        </div>
      </div>
    </div>
  );
}
