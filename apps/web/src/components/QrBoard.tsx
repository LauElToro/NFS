"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { DESTINATION_LABELS, type DestinationType, type QrItem } from "@/lib/qr-store";

const DESTINATIONS = Object.entries(DESTINATION_LABELS) as [DestinationType, string][];

function destinationLabel(type?: string) {
  return DESTINATION_LABELS[(type as DestinationType) || "otro"] ?? "Otro enlace";
}

type Account = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "reseller";
  credits: number;
};

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
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
    <img
      src={src}
      alt={`Vista previa del QR ${id}`}
      width={180}
      height={180}
      style={{ background: "#fff", borderRadius: 12, padding: 8 }}
    />
  );
}

async function downloadPng(item: QrItem) {
  const dataUrl = await QRCode.toDataURL(`${window.location.origin}/r/${item.id}`, {
    width: 512,
    margin: 2,
  });
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = `qr-${item.id}.png`;
  a.click();
}

export function QrBoard({ ownerId }: { ownerId?: string }) {
  const [account, setAccount] = useState<Account | null>(null);
  const [items, setItems] = useState<QrItem[]>([]);
  const [ready, setReady] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [destinationType, setDestinationType] = useState<DestinationType>("google");
  const [query, setQuery] = useState("");
  const [packCode, setPackCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const [meRes, qrRes] = await Promise.all([
      fetch("/api/me"),
      fetch(ownerId ? `/api/qrs?ownerId=${encodeURIComponent(ownerId)}` : "/api/qrs"),
    ]);
    if (!meRes.ok || !qrRes.ok) throw new Error("No se pudieron cargar los carteles");
    setAccount((await meRes.json()) as Account);
    setItems((await qrRes.json()) as QrItem[]);
  }

  useEffect(() => {
    load()
      .catch((e: Error) => setError(e.message))
      .finally(() => setReady(true));
  }, [ownerId]);

  const reseller = account?.role === "reseller";
  const readOnly = Boolean(ownerId);
  const visible = items.filter((item) => {
    const text = `${item.title} ${destinationLabel(item.destinationType)}`.toLowerCase();
    return text.includes(query.trim().toLowerCase());
  });

  async function save(item: QrItem, patch: Partial<QrItem>) {
    const next = { ...item, ...patch };
    const res = await fetch(`/api/qrs/${item.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: next.title,
        url: next.url,
        destinationType: next.destinationType,
        active: next.active,
      }),
    });
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    if (!res.ok) {
      setError(body?.error ?? "No se pudo guardar");
      return;
    }
    setError(null);
    setItems((current) => current.map((qr) => (qr.id === item.id ? { ...qr, ...next } : qr)));
  }

  if (!ready) return null;

  return (
    <div className="stack" style={{ gap: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: "0 0 0.35rem" }}>{reseller ? `Hola, ${account?.name}` : "Tus QRs"}</h1>
          <p className="muted" style={{ margin: 0 }}>
            El QR impreso sigue igual. Si cambiás el destino, la redirección cambia para todos.
          </p>
        </div>
        {reseller ? (
          <div className="card-panel" style={{ minWidth: 180 }}>
            <p className="muted" style={{ margin: 0 }}>
              Créditos disponibles
            </p>
            <strong style={{ fontSize: "2rem" }}>{account?.credits ?? 0}</strong>
          </div>
        ) : null}
      </div>

      {reseller && !readOnly ? (
        <form
          className="card-panel stack"
          onSubmit={async (e) => {
            e.preventDefault();
            const res = await fetch("/api/packs", {
              method: "PUT",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ code: packCode }),
            });
            const body = (await res.json().catch(() => null)) as { error?: string; account?: Account } | null;
            if (!res.ok || !body?.account) {
              setError(body?.error ?? "No se pudo activar el pack");
              return;
            }
            setAccount(body.account);
            setPackCode("");
            setError(null);
          }}
        >
          <h2 style={{ marginTop: 0 }}>Activar pack</h2>
          <label className="label">
            Código
            <input className="input" value={packCode} onChange={(e) => setPackCode(e.target.value)} placeholder="NFS30-...." />
          </label>
          <button className="btn secondary" type="submit">
            Activar
          </button>
        </form>
      ) : null}

      {!readOnly ? (
        <form
          className="card-panel stack"
          onSubmit={async (e) => {
            e.preventDefault();
            if (reseller && (account?.credits ?? 0) < 1) {
              setError("No hay créditos disponibles. Tenés que adquirir un nuevo pack.");
              return;
            }
            if (!title.trim() || !isHttpUrl(url.trim())) {
              setError("Completá el nombre y una URL válida");
              return;
            }
            setCreating(true);
            const res = await fetch("/api/qrs", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ title, url, destinationType }),
            });
            const body = (await res.json().catch(() => null)) as {
              error?: string;
              item?: QrItem;
              account?: Account;
            } | null;
            setCreating(false);
            if (!res.ok || !body?.item) {
              setError(body?.error ?? "No se pudo crear el cartel");
              return;
            }
            setError(null);
            setItems((current) => [body.item!, ...current]);
            if (body.account) setAccount(body.account);
            setTitle("");
            setUrl("");
          }}
        >
          <h2 style={{ marginTop: 0 }}>{reseller ? "Crear cartel" : "Crear QR"}</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "0.75rem",
            }}
          >
            <label className="label">
              Nombre del negocio
              <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Barbería Los Pibes" />
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
              URL
              <input className="input" value={url} onChange={(e) => setUrl(e.target.value)} type="url" required placeholder="https://..." />
            </label>
          </div>
          {error ? <p style={{ color: "var(--danger)" }}>{error}</p> : null}
          <button className="btn" type="submit" disabled={creating}>
            {reseller ? "Generar QR" : "Crear QR"}
          </button>
        </form>
      ) : null}

      {!reseller && error ? <p style={{ color: "var(--danger)" }}>{error}</p> : null}

      <label className="label">
        Buscar
        <input className="input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Nombre del negocio" />
      </label>

      <div className="stack">
        {visible.length === 0 ? <p className="muted">Todavía no hay carteles.</p> : null}
        {visible.map((item, index) => (
          <div key={item.id} className="card-panel" style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "flex-start" }}>
            <QrPreview id={item.id} />
            <div className="stack" style={{ flex: "1 1 240px" }}>
              <p className="muted" style={{ margin: 0 }}>
                #{String(items.length - index).padStart(3, "0")}
                {account?.role === "admin" && item.ownerEmail ? ` · ${item.ownerName || item.ownerEmail}` : ""}
                {" · "}
                {item.active === false ? "Inactivo" : "Activo"}
              </p>
              <label className="label">
                Cliente
                <input
                  className="input"
                  value={item.title}
                  onChange={(e) => setItems((current) => current.map((qr) => (qr.id === item.id ? { ...qr, title: e.target.value } : qr)))}
                  onBlur={(e) => save(item, { title: e.target.value })}
                />
              </label>
              <label className="label">
                Tipo de destino
                <select
                  className="input"
                  value={item.destinationType || "otro"}
                  onChange={(e) => {
                    const destinationType = e.target.value as DestinationType;
                    setItems((current) => current.map((qr) => (qr.id === item.id ? { ...qr, destinationType } : qr)));
                    save(item, { destinationType });
                  }}
                >
                  {DESTINATIONS.map(([id, label]) => (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="label">
                URL
                <input
                  className="input"
                  type="url"
                  value={item.url}
                  onChange={(e) => setItems((current) => current.map((qr) => (qr.id === item.id ? { ...qr, url: e.target.value } : qr)))}
                  onBlur={(e) => save(item, { url: e.target.value })}
                />
              </label>
              <p className="muted" style={{ margin: 0 }}>
                Destino: {destinationLabel(item.destinationType)}
              </p>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <a className="btn secondary" href={`/r/${item.id}`} target="_blank" rel="noreferrer">
                  Probar
                </a>
                <button className="btn" type="button" onClick={() => downloadPng(item)}>
                  Descargar PNG
                </button>
                {account?.role === "admin" ? (
                  <button
                    className="btn secondary"
                    type="button"
                    onClick={() => save(item, { active: item.active === false })}
                  >
                    {item.active === false ? "Activar" : "Desactivar"}
                  </button>
                ) : null}
                {!readOnly || account?.role === "admin" ? (
                  <button
                    className="btn secondary"
                    type="button"
                    onClick={async () => {
                      if (!window.confirm(`¿Seguro que querés eliminar «${item.title || item.id}»?`)) return;
                      const res = await fetch(`/api/qrs/${item.id}`, { method: "DELETE" });
                      if (!res.ok) {
                        setError("No se pudo eliminar");
                        return;
                      }
                      setItems((current) => current.filter((qr) => qr.id !== item.id));
                    }}
                  >
                    Eliminar
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
