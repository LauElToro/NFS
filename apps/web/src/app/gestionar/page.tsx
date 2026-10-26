"use client";

import { useEffect, useState } from "react";

const TYPES = [
  ["google", "Reseñas de Google"],
  ["instagram", "Instagram"],
  ["whatsapp", "WhatsApp"],
  ["web", "Sitio web"],
  ["otro", "Otro enlace"],
] as const;

export default function ManagePage() {
  const [token, setToken] = useState("");
  const [cartelId, setCartelId] = useState("");
  const [publicPath, setPublicPath] = useState("");
  const [type, setType] = useState<(typeof TYPES)[number][0]>("otro");
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [saved, setSaved] = useState(false);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    const secret = window.location.hash.replace(/^#/, "");
    if (!secret) {
      setError("Este enlace no tiene la clave de administración. Solo se mostró una vez al activar el cartel.");
      setReady(true);
      return;
    }
    setToken(secret);
    void fetch("/api/gestionar", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token: secret }),
    })
      .then(async (res) => {
        const data = (await res.json().catch(() => null)) as { error?: string; cartelId?: string; publicPath?: string; destinationUrl?: string; destinationType?: string } | null;
        if (!res.ok || !data?.cartelId) {
          setError(data?.error || "El enlace no es válido");
          return;
        }
        setCartelId(data.cartelId);
        setPublicPath(data.publicPath || "");
        setUrl(data.destinationUrl || "");
        const known = TYPES.some(([value]) => value === data.destinationType);
        setType(known ? (data.destinationType as (typeof TYPES)[number][0]) : "otro");
      })
      .catch(() => setError("No se pudo abrir el cartel"))
      .finally(() => setReady(true));
  }, []);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setWorking(true);
    setError("");
    setSaved(false);
    const res = await fetch("/api/gestionar", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token, url, destinationType: type }),
    });
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    setWorking(false);
    if (!res.ok) {
      setError(data?.error || "No se pudo guardar");
      return;
    }
    setSaved(true);
  }

  return (
    <main className="auth-screen">
      <section className="auth-card card-panel stack activate-card">
        <img className="brand-logo" src="/reviewsgo-wordmark.jpg" alt="ReviewsGO" />
        <h1 style={{ margin: 0 }}>Cambiar el destino</h1>
        {!ready ? <p className="muted">Cargando…</p> : null}
        {ready && cartelId ? (
          <form className="stack" onSubmit={(event) => void save(event)}>
            <p className="muted" style={{ margin: 0 }}>Cartel {cartelId}. La dirección del NFC y del QR no cambia.</p>
            <label className="label">
              Tipo de destino
              <select className="input" value={type} onChange={(event) => setType(event.target.value as (typeof TYPES)[number][0])}>
                {TYPES.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>
            <label className="label">
              URL de destino
              <input className="input" inputMode="url" autoCapitalize="none" autoCorrect="off" value={url} onChange={(event) => setUrl(event.target.value)} />
            </label>
            {saved ? <p style={{ margin: 0 }}>Destino actualizado. El QR y el NFC ya usan este enlace.</p> : null}
            {error ? <p style={{ color: "var(--danger)", margin: 0 }}>{error}</p> : null}
            <button className="btn" type="submit" disabled={working || !url.trim()} aria-busy={working}>Guardar cambios</button>
            {publicPath ? <a href={publicPath}>Probar el cartel</a> : null}
          </form>
        ) : null}
        {ready && !cartelId && error ? <p style={{ color: "var(--danger)", margin: 0 }}>{error}</p> : null}
      </section>
    </main>
  );
}
