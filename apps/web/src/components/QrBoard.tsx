"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import {
  DESTINATION_LABELS,
  POSTER_STATUSES,
  STATUS_LABELS,
  type DestinationType,
  type PosterStatus,
  type QrItem,
} from "@/lib/qr-store";

const DESTINATIONS = Object.entries(DESTINATION_LABELS) as [DestinationType, string][];

function destinationLabel(type?: string) {
  return DESTINATION_LABELS[(type as DestinationType) || "otro"] ?? "Otro enlace";
}

type Account = { id: string; name: string; email: string; role: "admin" | "reseller" };
type Reseller = { id: string; name: string; email: string; active: boolean };

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function publicSlug(item: QrItem) {
  return item.token || item.uniqueCode || item.id;
}

function QrPreview({ id }: { id: string }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(`${window.location.origin}/r/${id}`, { width: 220, margin: 1 }).then((url) => {
      if (!cancelled) setSrc(url);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);
  if (!src) return null;
  return (
    <img src={src} alt={`QR ${id}`} width={160} height={160} style={{ background: "#fff", borderRadius: 12, padding: 8 }} />
  );
}

async function downloadPng(id: string) {
  const dataUrl = await QRCode.toDataURL(`${window.location.origin}/r/${id}`, { width: 512, margin: 2 });
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = `cartel-${id}.png`;
  a.click();
}

export function QrBoard({ ownerId }: { ownerId?: string }) {
  const [account, setAccount] = useState<Account | null>(null);
  const [items, setItems] = useState<QrItem[]>([]);
  const [resellers, setResellers] = useState<Reseller[]>([]);
  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [urlFilter, setUrlFilter] = useState<string>("todos");
  const [count, setCount] = useState(10);
  const [selected, setSelected] = useState<string[]>([]);
  const [resellerId, setResellerId] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const qrRes = await fetch(ownerId ? `/api/qrs?ownerId=${encodeURIComponent(ownerId)}` : "/api/qrs");
    const meRes = await fetch("/api/me");
    if (!qrRes.ok || !meRes.ok) throw new Error("No se pudieron cargar los carteles");
    const me = (await meRes.json()) as Account;
    setAccount(me);
    setItems((await qrRes.json()) as QrItem[]);
    if (me.role === "admin") {
      const usersRes = await fetch("/api/resellers");
      if (usersRes.ok) setResellers((await usersRes.json()) as Reseller[]);
    }
  }

  useEffect(() => {
    load()
      .catch((e: Error) => setError(e.message))
      .finally(() => setReady(true));
  }, [ownerId]);

  const admin = account?.role === "admin";
  const available = items.filter((item) => item.status === "disponible");
  const visible = items.filter((item) => {
    const text = `${item.cartelId || ""} ${item.uniqueCode || item.id} ${item.title} ${item.ownerName || ""}`.toLowerCase();
    if (query.trim() && !text.includes(query.trim().toLowerCase())) return false;
    if (statusFilter !== "todos" && item.status !== statusFilter) return false;
    if (urlFilter === "con" && !item.url) return false;
    if (urlFilter === "sin" && item.url) return false;
    if (ownerId && item.ownerId !== ownerId) return false;
    return true;
  });

  async function patch(id: string, body: Record<string, unknown>) {
    const res = await fetch(`/api/qrs/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    if (!res.ok) {
      setError(data?.error ?? "No se pudo guardar");
      return;
    }
    setError(null);
    await load();
  }

  if (!ready) return null;

  return (
    <div className="stack" style={{ gap: "1.5rem" }}>
      <div>
        <h1 style={{ margin: "0 0 0.35rem" }}>{admin ? "Inventario" : `Hola, ${account?.name}`}</h1>
        <p className="muted" style={{ margin: 0 }}>
          {admin
            ? "Cada cartel tiene un QR permanente. Asignalo a un revendedor; el destino se configura después."
            : "Configurá el destino de los carteles que te asignaron. El QR impreso no cambia."}
        </p>
      </div>

      {admin && !ownerId ? (
        <form
          className="card-panel stack"
          onSubmit={async (e) => {
            e.preventDefault();
            const res = await fetch("/api/qrs", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ count }),
            });
            const data = (await res.json().catch(() => null)) as { error?: string } | null;
            if (!res.ok) {
              setError(data?.error ?? "No se pudieron crear");
              return;
            }
            setError(null);
            await load();
          }}
        >
          <h2 style={{ marginTop: 0 }}>Crear carteles</h2>
          <label className="label">
            Cantidad
            <input className="input" type="number" min={1} max={100} value={count} onChange={(e) => setCount(Number(e.target.value))} />
          </label>
          <button className="btn" type="submit">
            Crear cartel
          </button>
        </form>
      ) : null}

      {admin && !ownerId ? (
        <div className="card-panel stack">
          <h2 style={{ marginTop: 0 }}>Asignar stock</h2>
          <label className="label">
            Revendedor
            <select className="input" value={resellerId} onChange={(e) => setResellerId(e.target.value)}>
              <option value="">Elegir</option>
              {resellers.filter((user) => user.active).map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} · {user.email}
                </option>
              ))}
            </select>
          </label>
          {available.length === 0 ? (
            <p className="muted" style={{ margin: 0 }}>
              No hay carteles disponibles para asignar.
            </p>
          ) : (
            <div className="stack">
              {available.map((item) => (
                <label key={item.id} style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
                  <input
                    type="checkbox"
                    checked={selected.includes(item.id)}
                    onChange={(e) =>
                      setSelected((current) =>
                        e.target.checked ? [...current, item.id] : current.filter((id) => id !== item.id),
                      )
                    }
                  />
                  <span>{item.cartelId || item.uniqueCode || item.id}</span>
                </label>
              ))}
            </div>
          )}
          <button
            className="btn"
            type="button"
            disabled={selected.length === 0 || !resellerId}
            onClick={async () => {
              const res = await fetch("/api/qrs/assign", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ resellerId, ids: selected }),
              });
              const data = (await res.json().catch(() => null)) as { error?: string; assigned?: number } | null;
              if (!res.ok) {
                setError(data?.error ?? "No se pudo asignar");
                return;
              }
              setSelected([]);
              setError(null);
              await load();
            }}
          >
            Asignar {selected.length} cartel{selected.length === 1 ? "" : "es"}
          </button>
        </div>
      ) : null}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.75rem" }}>
        <label className="label">
          Buscar
          <input className="input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Código, comercio o revendedor" />
        </label>
        {admin ? (
          <label className="label">
            Estado
            <select className="input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="todos">Todos</option>
              {POSTER_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        {admin ? (
          <label className="label">
            Destino
            <select className="input" value={urlFilter} onChange={(e) => setUrlFilter(e.target.value)}>
              <option value="todos">Todos</option>
              <option value="con">Con URL</option>
              <option value="sin">Sin URL</option>
            </select>
          </label>
        ) : null}
      </div>

      {error ? <p style={{ color: "var(--danger)" }}>{error}</p> : null}

      <div className="stack">
        {visible.length === 0 ? <p className="muted">No hay carteles para mostrar.</p> : null}
        {visible.map((item) => {
          const code = item.uniqueCode || item.id;
          const slug = publicSlug(item);
          const editing = openId === item.id;
          return (
            <article key={item.id} className="card-panel" style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              <QrPreview id={slug} />
              <div className="stack" style={{ flex: "1 1 240px" }}>
                <div>
                  <strong>{item.cartelId || item.id}</strong>
                  <p className="muted" style={{ margin: "0.25rem 0 0" }}>
                    {code} · {STATUS_LABELS[item.status || "disponible"]}
                    {item.ownerName ? ` · ${item.ownerName}` : ""}
                    {item.title ? ` · ${item.title}` : ""}
                  </p>
                  <p className="muted" style={{ margin: "0.25rem 0 0" }}>
                    Destino: {item.url || "sin configurar"}
                  </p>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  {item.url ? (
                    <a className="btn secondary" href={`/r/${slug}`} target="_blank" rel="noreferrer">
                      Probar
                    </a>
                  ) : null}
                  <button className="btn" type="button" onClick={() => downloadPng(slug)}>
                    Descargar PNG
                  </button>
                  <button className="btn secondary" type="button" onClick={() => setOpenId(editing ? null : item.id)}>
                    {editing ? "Cerrar" : "Configurar"}
                  </button>
                  {admin ? (
                    <button
                      className="btn secondary"
                      type="button"
                      onClick={async () => {
                        const label = item.cartelId || code;
                        if (!window.confirm(`¿Seguro que querés eliminar ${label}? El QR dejará de funcionar.`)) return;
                        const res = await fetch(`/api/qrs/${item.id}`, { method: "DELETE" });
                        const data = (await res.json().catch(() => null)) as { error?: string } | null;
                        if (!res.ok) {
                          setError(data?.error ?? "No se pudo eliminar");
                          return;
                        }
                        setSelected((current) => current.filter((id) => id !== item.id));
                        setError(null);
                        await load();
                      }}
                    >
                      Eliminar
                    </button>
                  ) : null}
                </div>
                {editing ? (
                  <PosterForm item={item} admin={Boolean(admin)} onSave={(body) => patch(item.id, body)} />
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function PosterForm({
  item,
  admin,
  onSave,
}: {
  item: QrItem;
  admin: boolean;
  onSave: (body: Record<string, unknown>) => Promise<void>;
}) {
  const [title, setTitle] = useState(item.title);
  const [url, setUrl] = useState(item.url);
  const [destinationType, setDestinationType] = useState<DestinationType>(item.destinationType || "google");
  const [status, setStatus] = useState<PosterStatus>(item.status || "disponible");

  return (
    <form
      className="stack"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!isHttpUrl(url.trim())) return;
        await onSave({ title, url, destinationType, ...(admin ? { status } : {}) });
      }}
    >
      <p className="muted" style={{ margin: 0 }}>
        URL del QR: /r/{item.token || item.uniqueCode || item.id}
      </p>
      <label className="label">
        Comercio
        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nombre del comercio" />
      </label>
      <label className="label">
        Tipo de destino
        <select className="input" value={destinationType} onChange={(e) => setDestinationType(e.target.value as DestinationType)}>
          {DESTINATIONS.map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label className="label">
        URL de destino
        <input className="input" type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." required />
      </label>
      {admin ? (
        <label className="label">
          Estado
          <select className="input" value={status} onChange={(e) => setStatus(e.target.value as PosterStatus)}>
            {POSTER_STATUSES.map((value) => (
              <option key={value} value={value}>
                {STATUS_LABELS[value]}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <button className="btn" type="submit">
          Guardar cambios
        </button>
        {!admin ? (
          <button className="btn secondary" type="button" onClick={() => onSave({ title, url, destinationType, sale: true })}>
            Registrar venta
          </button>
        ) : null}
      </div>
      {item.history && item.history.length > 0 ? (
        <div className="stack">
          <strong>Historial</strong>
          {item.history.map((change) => (
            <p key={`${change.at}-${change.to}`} className="muted" style={{ margin: 0 }}>
              {new Date(change.at).toLocaleString("es-AR")} · {change.from || "vacío"} → {change.to || "vacío"} · {change.byName}
              {admin && change.from ? (
                <>
                  {" "}
                  <button className="btn secondary" type="button" onClick={() => onSave({ restoreUrl: change.from })}>
                    Restaurar
                  </button>
                </>
              ) : null}
            </p>
          ))}
        </div>
      ) : null}
    </form>
  );
}
