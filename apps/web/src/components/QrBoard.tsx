"use client";

import { useState } from "react";
import QRCode from "qrcode";
import catalog from "../../../../data/qrs.json";

type QrItem = { title: string; url: string; published: boolean };

function slugFromTitle(title: string): string {
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

function qrText(item: QrItem): string {
  if (!item.published) return item.url;
  const origin = window.location.origin;
  return `${origin}/r/${slugFromTitle(item.title)}`;
}

async function downloadPng(item: QrItem) {
  const dataUrl = await QRCode.toDataURL(qrText(item), { width: 512, margin: 2 });
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = `qr-${slugFromTitle(item.title)}.png`;
  a.click();
}

const initial: QrItem[] = (catalog as { title: string; url: string }[]).map((qr) => ({
  ...qr,
  published: true,
}));

export function QrBoard() {
  const [items, setItems] = useState<QrItem[]>(initial);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="stack" style={{ gap: "1.5rem" }}>
      <div>
        <h1 style={{ margin: "0 0 0.35rem" }}>Tus QRs</h1>
        <p className="muted" style={{ margin: 0 }}>
          El PNG se genera en el navegador.
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
          setError(null);
          setItems((prev) => [{ title: nextTitle, url: nextUrl, published: false }, ...prev]);
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
        {items.map((item) => {
          const slug = slugFromTitle(item.title);
          return (
            <div
              key={`${slug}-${item.url}`}
              className="card-panel"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: "1rem",
                alignItems: "center",
              }}
            >
              <div>
                <h3 style={{ margin: "0 0 0.35rem" }}>{item.title}</h3>
                <p style={{ margin: 0, fontSize: "0.95rem" }}>{item.url}</p>
                <p className="muted" style={{ margin: "0.35rem 0 0" }}>
                  {item.published ? `Redirige por /r/${slug}` : "QR directo a la URL"}
                </p>
              </div>
              <button className="btn" type="button" onClick={() => downloadPng(item)}>
                Descargar PNG
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
