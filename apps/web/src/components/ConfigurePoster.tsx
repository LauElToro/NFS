"use client";

import Link from "next/link";
import { useState } from "react";
import { DESTINATION_LABELS, type DestinationType } from "@/lib/qr-store";

const DESTINATIONS = Object.entries(DESTINATION_LABELS) as [DestinationType, string][];

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function ConfigurePoster({
  id,
  code,
  publicPath,
  initialTitle,
  initialUrl,
  initialType,
}: {
  id: string;
  code: string;
  publicPath: string;
  initialTitle: string;
  initialUrl: string;
  initialType: DestinationType;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [url, setUrl] = useState(initialUrl);
  const [destinationType, setDestinationType] = useState<DestinationType>(initialType);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!isHttpUrl(url.trim())) {
      setError("Ingresá una URL de destino que empiece con https://");
      return;
    }
    setPending(true);
    setError("");
    const res = await fetch(`/api/qrs/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title, url: url.trim(), destinationType }),
    });
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    setPending(false);
    if (!res.ok) {
      setError(data?.error || "No se pudo guardar");
      return;
    }
    setSaved(true);
  }

  return (
    <div className="stack" style={{ gap: "1.25rem" }}>
      <div>
        <h1 style={{ margin: "0 0 0.35rem" }}>Configurar este cartel</h1>
        <p className="muted" style={{ margin: 0 }}>
          Código del QR: <strong>{code}</strong>. El identificador no cambia al guardar el destino.
        </p>
      </div>
      <form className="card-panel stack" onSubmit={(event) => void save(event)}>
        <label className="label">
          Comercio
          <input className="input" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Nombre del comercio" />
        </label>
        <label className="label">
          Tipo de destino
          <select className="input" value={destinationType} onChange={(event) => setDestinationType(event.target.value as DestinationType)}>
            {DESTINATIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="label">
          URL de destino
          <input className="input" type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://..." required />
        </label>
        {error ? <p style={{ color: "var(--danger)", margin: 0 }}>{error}</p> : null}
        {saved ? <p style={{ color: "#137333", fontWeight: 650, margin: 0 }}>Destino guardado. El próximo escaneo abre esa URL.</p> : null}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button className="btn" type="submit" disabled={pending} aria-busy={pending}>
            {pending ? "Guardando..." : "Guardar cambios"}
          </button>
          <Link className="btn secondary" href="/app">
            Volver al panel
          </Link>
          {saved ? (
            <a className="btn secondary" href={publicPath}>
              Probar QR
            </a>
          ) : null}
        </div>
      </form>
    </div>
  );
}
