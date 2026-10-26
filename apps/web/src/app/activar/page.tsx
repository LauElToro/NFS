"use client";

import { useState } from "react";

const TYPES = [
  ["google", "Reseñas de Google"],
  ["instagram", "Instagram"],
  ["whatsapp", "WhatsApp"],
  ["web", "Sitio web"],
  ["otro", "Otro enlace"],
] as const;

export default function ActivatePage() {
  const [code, setCode] = useState("");
  const [readyCode, setReadyCode] = useState("");
  const [cartelId, setCartelId] = useState("");
  const [type, setType] = useState<(typeof TYPES)[number][0]>("google");
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);
  const [done, setDone] = useState<{ publicPath: string; managePath: string } | null>(null);

  async function continueCode(event: React.FormEvent) {
    event.preventDefault();
    setWorking(true);
    setError("");
    const res = await fetch("/api/activar", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "validar", code }),
    });
    const data = (await res.json().catch(() => null)) as { error?: string; cartelId?: string } | null;
    setWorking(false);
    if (!res.ok || !data?.cartelId) {
      setError(data?.error || "El código no es válido");
      return;
    }
    setReadyCode(code);
    setCartelId(data.cartelId);
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setWorking(true);
    setError("");
    const res = await fetch("/api/activar", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "guardar", code: readyCode, url, destinationType: type }),
    });
    const data = (await res.json().catch(() => null)) as { error?: string; publicPath?: string; managePath?: string } | null;
    setWorking(false);
    if (!res.ok || !data?.publicPath || !data.managePath) {
      setError(data?.error || "No se pudo activar el cartel");
      return;
    }
    setDone({ publicPath: data.publicPath, managePath: data.managePath });
  }

  const help =
    type === "google"
      ? "Pegá el enlace de reseñas de Google o el Place ID."
      : type === "whatsapp"
        ? "Pegá el enlace completo, por ejemplo https://wa.me/5491112345678."
        : "El mismo enlace se usa para el NFC y para el QR.";

  return (
    <main className="auth-screen">
      <section className="auth-card card-panel stack activate-card">
        <img className="brand-logo" src="/reviewsgo-wordmark.jpg" alt="ReviewsGO" />
        {done ? (
          <>
            <h1 style={{ margin: 0 }}>Tu cartel ya está listo</h1>
            <p className="muted" style={{ margin: 0 }}>
              Cuando alguien escanee el QR o acerque el teléfono al NFC, va a ir a la dirección que configuraste. El código de activación ya no vuelve a funcionar.
            </p>
            <p style={{ margin: 0 }}>
              <a href={done.publicPath}>Probar el cartel</a>
            </p>
            <div className="card-panel stack" style={{ margin: 0 }}>
              <strong>Guardá este enlace de administración</strong>
              <p className="muted" style={{ margin: 0 }}>Se muestra una sola vez. Sirve para cambiar el destino más adelante, sin el código del paquete.</p>
              <a href={done.managePath}>{new URL(done.managePath, window.location.origin).toString()}</a>
              <button
                className="btn secondary"
                type="button"
                onClick={() => void navigator.clipboard.writeText(new URL(done.managePath, window.location.origin).toString())}
              >
                Copiar enlace
              </button>
            </div>
          </>
        ) : readyCode ? (
          <form className="stack" onSubmit={(event) => void save(event)}>
            <h1 style={{ margin: 0 }}>Configurá tu cartel</h1>
            <p className="muted" style={{ margin: 0 }}>Cartel {cartelId}. El enlace se utiliza tanto para el NFC como para el QR.</p>
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
              <input className="input" inputMode="url" autoCapitalize="none" autoCorrect="off" value={url} placeholder="https://" onChange={(event) => setUrl(event.target.value)} />
            </label>
            <p className="muted" style={{ margin: 0 }}>{help}</p>
            {error ? <p style={{ color: "var(--danger)", margin: 0 }}>{error}</p> : null}
            <button className="btn" type="submit" disabled={working || !url.trim()} aria-busy={working}>Activar mi cartel</button>
          </form>
        ) : (
          <form className="stack" onSubmit={(event) => void continueCode(event)}>
            <h1 style={{ margin: 0 }}>Activá tu cartel ReviewsGO</h1>
            <p className="muted" style={{ margin: 0 }}>Ingresá el código que recibiste junto a tu compra para configurar el destino de tu NFC y código QR.</p>
            <label className="label">
              Código de activación
              <input className="input activation-code" autoCapitalize="characters" autoCorrect="off" value={code} placeholder="RG-XXXX-XXXX-XXXX-XXXX" onChange={(event) => setCode(event.target.value)} />
            </label>
            {error ? <p style={{ color: "var(--danger)", margin: 0 }}>{error}</p> : null}
            <button className="btn" type="submit" disabled={working || !code.trim()} aria-busy={working}>{working ? "Revisando…" : "Continuar"}</button>
          </form>
        )}
      </section>
    </main>
  );
}
