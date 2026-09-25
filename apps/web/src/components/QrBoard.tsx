"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { slugFromTitle, type QrItem } from "@/lib/qr-store";

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

export function QrBoard() {
  const [items, setItems] = useState<QrItem[]>([]);
  const [ready, setReady] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const itemsRef = useRef<QrItem[]>([]);

  useEffect(() => {
    fetch("/api/qrs")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: QrItem[]) => remember(data))
      .catch(() => setError("No se pudieron cargar los QR"))
      .finally(() => setReady(true));
  }, []);

  function remember(next: QrItem[]) {
    itemsRef.current = next;
    setItems(next);
  }

  function edit(id: string, patch: Partial<QrItem>) {
    remember(itemsRef.current.map((qr) => (qr.id === id ? { ...qr, ...patch } : qr)));
  }

  async function persist(next: QrItem[]) {
    if (next.some((item) => !item.title.trim() || !isHttpUrl(item.url))) return;
    const res = await fetch("/api/qrs", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(next),
    });
    if (!res.ok) setError("No se pudo guardar el cambio");
    else setError(null);
  }

  if (!ready) return null;

  return (
    <div className="stack" style={{ gap: "1.5rem" }}>
      <div>
        <h1 style={{ margin: "0 0 0.35rem" }}>Tus QRs</h1>
          <p className="muted" style={{ margin: 0 }}>
          El QR impreso sigue en /r/… Al cambiar la URL, esa redirección cambia para todos.
        </p>
      </div>

      <form
        className="card-panel stack"
        onSubmit={(e) => {
          e.preventDefault();
          const nextTitle = title.trim();
          const nextUrl = url.trim();
          if (!nextTitle || !nextUrl) return;
          try {
            new URL(nextUrl);
          } catch {
            setError("La URL no es válida");
            return;
          }
          const base = slugFromTitle(nextTitle);
          let id = base;
          let n = 1;
          while (items.some((qr) => qr.id === id)) {
            n += 1;
            id = `${base}-${n}`;
          }
          setError(null);
          const next = [{ id, title: nextTitle, url: nextUrl }, ...itemsRef.current];
          remember(next);
          persist(next);
          setTitle("");
          setUrl("");
        }}
      >
        <h2 style={{ marginTop: 0 }}>Crear QR</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "0.75rem",
          }}
        >
          <label className="label">
            Título
            <input
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Menú terraza"
            />
          </label>
          <label className="label">
            URL
            <input
              className="input"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              type="url"
              required
              placeholder="https://..."
            />
          </label>
        </div>
        {error ? <p style={{ color: "var(--danger)" }}>{error}</p> : null}
        <button className="btn" type="submit">
          Crear QR
        </button>
      </form>

      <div className="stack">
        {items.length === 0 ? <p className="muted">Todavía no hay QRs.</p> : null}
        {items.map((item) => (
          <div key={item.id} className="card-panel" style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "flex-start" }}>
            <QrPreview id={item.id} />
            <div className="stack" style={{ flex: "1 1 240px" }}>
            <label className="label">
              Título
              <input
                className="input"
                value={item.title}
                onChange={(e) => edit(item.id, { title: e.target.value })}
                onBlur={() => persist(itemsRef.current)}
              />
            </label>
            <label className="label">
              URL
              <input
                className="input"
                type="url"
                value={item.url}
                onChange={(e) => edit(item.id, { url: e.target.value })}
                onBlur={() => persist(itemsRef.current)}
              />
            </label>
            <p className="muted" style={{ margin: 0 }}>
              /r/{item.id}
            </p>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <a className="btn secondary" href={`/r/${item.id}`} target="_blank" rel="noreferrer">
                Probar
              </a>
              <button className="btn" type="button" onClick={() => downloadPng(item)}>
                Descargar PNG
              </button>
              <button
                className="btn secondary"
                type="button"
                onClick={() => {
                  if (!window.confirm(`¿Seguro que querés eliminar «${item.title || item.id}»?`)) return;
                  const next = itemsRef.current.filter((qr) => qr.id !== item.id);
                  remember(next);
                  persist(next);
                }}
              >
                Eliminar
              </button>
            </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
