"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { parsePlaceId, reviewUrl } from "@/lib/review-link";
import type { PlaceHit } from "@/lib/places-search";

type Poster = {
  id: string;
  title: string;
  url: string;
  cartelId?: string;
  uniqueCode?: string;
  token?: string;
  status?: string;
};

type Chosen = { id: string; name: string; address: string };

function codeOf(poster: Poster) {
  return poster.cartelId || poster.uniqueCode || poster.id;
}

export function ReviewLinkGenerator({ admin = false }: { admin?: boolean }) {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const [searching, setSearching] = useState(false);
  const [looked, setLooked] = useState(false);
  const [results, setResults] = useState<PlaceHit[]>([]);
  const [skipped, setSkipped] = useState(0);
  const [selectedId, setSelectedId] = useState("");
  const [manualId, setManualId] = useState("");
  const [manualName, setManualName] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");
  const [posters, setPosters] = useState<Poster[] | null>(null);
  const [posterId, setPosterId] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<{ id: string; code: string; publicPath: string } | null>(null);

  useEffect(() => {
    fetch("/api/places/search")
      .then(async (res) => {
        const data = (await res.json()) as { configured?: boolean };
        setConfigured(Boolean(data.configured));
      })
      .catch(() => setConfigured(false));
  }, []);

  const selected = results.find((item) => item.id === selectedId) || null;
  const manual = parsePlaceId(manualId);
  const chosen: Chosen | null = selected
    ? { id: selected.id, name: selected.name, address: selected.address }
    : manual
      ? { id: manual, name: manualName.trim(), address: "" }
      : null;
  const url = chosen ? reviewUrl(chosen.id) : null;
  const poster = posters?.find((item) => item.id === posterId) || null;

  async function search(event: React.FormEvent) {
    event.preventDefault();
    setSearching(true);
    setLooked(false);
    setError("");
    setResults([]);
    setSkipped(0);
    setSelectedId("");
    setSaved(null);
    try {
      const res = await fetch("/api/places/search", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, area }),
      });
      const data = (await res.json()) as { error?: string; places?: PlaceHit[]; skipped?: number; configured?: boolean };
      if (typeof data.configured === "boolean") setConfigured(data.configured);
      if (!res.ok) throw new Error(data.error || "No se pudo buscar el negocio");
      setLooked(true);
      setResults(Array.isArray(data.places) ? data.places : []);
      setSkipped(data.skipped || 0);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudo conectar con Google.");
    } finally {
      setSearching(false);
    }
  }

  async function copy(value: string, which: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(which);
      window.setTimeout(() => setCopied(""), 2000);
    } catch {
      setError("No se pudo copiar. Seleccioná el texto y copialo a mano.");
    }
  }

  async function loadPosters() {
    if (posters) return;
    const res = await fetch("/api/qrs");
    const data = (await res.json()) as Poster[] | { error?: string };
    if (!res.ok || !Array.isArray(data)) {
      setError(!Array.isArray(data) && data.error ? data.error : "No se pudieron leer los carteles");
      setPosters([]);
      return;
    }
    setPosters(data);
  }

  async function assign() {
    if (!url || !chosen || !poster || saving) return;
    setSaving(true);
    setError("");
    setSaved(null);
    try {
      const res = await fetch(`/api/qrs/${encodeURIComponent(poster.id)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          url,
          destinationType: "google",
          ...(poster.title.trim() ? {} : { title: chosen.name }),
        }),
      });
      const data = (await res.json()) as Poster & { error?: string };
      if (!res.ok) throw new Error(data.error || "No se pudo guardar el destino");
      if (data.id !== poster.id || data.uniqueCode !== poster.uniqueCode || data.cartelId !== poster.cartelId || data.token !== poster.token) {
        throw new Error("El cartel no conservó su código. El destino no quedó confirmado.");
      }
      const publicPath = `/r/${data.token || data.uniqueCode || data.id}`;
      setSaved({ id: data.id, code: codeOf(data), publicPath });
      setPosters((current) => current?.map((item) => item.id === data.id ? { ...item, ...data } : item) || current);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudo guardar el destino");
    } finally {
      setSaving(false);
    }
  }

  function reset() {
    setName("");
    setArea("");
    setResults([]);
    setSkipped(0);
    setLooked(false);
    setSelectedId("");
    setManualId("");
    setManualName("");
    setError("");
    setCopied("");
    setSaved(null);
    setPosterId("");
  }

  return (
    <div className="stack">
      <div>
        <h1 className="page-title">Enlaces de reseñas</h1>
        <p className="page-lead muted">
          Buscá el negocio, elegí el local correcto y generá el enlace para que el cliente deje una reseña en Google.
        </p>
      </div>

      {configured === false ? (
        <p className="store-note">
          La búsqueda automática no está configurada. Pegá un Place ID real para generar el enlace. El resto del panel sigue disponible.
        </p>
      ) : null}

      <form className="card-panel stack" onSubmit={(event) => void search(event)}>
        <h2 style={{ margin: 0 }}>Buscar negocio</h2>
        <label className="label">
          Nombre del negocio
          <input className="input" value={name} onChange={(event) => setName(event.target.value)} placeholder="Ejemplo: Café del Centro" />
        </label>
        <label className="label">
          Ciudad, localidad o dirección
          <input className="input" value={area} onChange={(event) => setArea(event.target.value)} placeholder="Ejemplo: Quilmes, Buenos Aires" />
        </label>
        <button className="btn" type="submit" disabled={searching || configured === false}>
          {searching ? "Buscando en Google..." : "Buscar"}
        </button>
        {configured === null ? <p className="muted" style={{ margin: 0 }}>Comprobando la búsqueda de Google...</p> : null}
      </form>

      {error ? <p style={{ color: "var(--danger)", margin: 0 }}>{error}</p> : null}

      {results.length > 0 ? (
        <section className="card-panel stack">
          <h2 style={{ margin: 0 }}>Elegí el establecimiento</h2>
          <ul className="review-results">
            {results.map((item) => (
              <li key={item.id}>
                <button type="button" aria-pressed={item.id === selectedId} onClick={() => { setSelectedId(item.id); setManualId(""); setSaved(null); }}>
                  <strong>{item.name}</strong>
                  <span>{[item.kind, item.address].filter(Boolean).join(" · ") || "Sin dirección informada"}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {!searching && results.length === 0 && skipped > 0 ? (
        <p className="store-note">Google respondió, pero ningún resultado trajo un Place ID. No se puede generar el enlace con esa búsqueda.</p>
      ) : null}
      {!searching && looked && results.length === 0 && skipped === 0 && !error ? (
        <p className="store-note">No encontré negocios con ese nombre. Sumá la ciudad o pegá el Place ID.</p>
      ) : null}
      {results.length > 0 && skipped > 0 ? (
        <p className="muted" style={{ margin: 0 }}>Algunos resultados no trajeron Place ID y no se pueden elegir.</p>
      ) : null}

      <section className="card-panel stack">
        <h2 style={{ margin: 0 }}>Place ID manual</h2>
        <p className="muted" style={{ margin: 0 }}>
          Si ya tenés el identificador, el enlace se arma sin consultar Google.
        </p>
        <label className="label">
          Place ID
          <input className="input" value={manualId} onChange={(event) => { setManualId(event.target.value); setSelectedId(""); setSaved(null); }} placeholder="ChIJ..." />
        </label>
        {manualId.trim() && !manual ? <p style={{ color: "var(--danger)", margin: 0 }}>Ese Place ID no tiene un formato válido.</p> : null}
        <label className="label">
          Nombre del negocio (opcional)
          <input className="input" value={manualName} onChange={(event) => setManualName(event.target.value)} />
        </label>
      </section>

      {url && chosen ? (
        <section className="card-panel stack">
          <h2 style={{ margin: 0 }}>Enlace de reseñas</h2>
          <p style={{ margin: 0 }}><strong>{chosen.name || "Negocio sin nombre"}</strong></p>
          {chosen.address ? <p className="muted" style={{ margin: 0 }}>{chosen.address}</p> : null}
          <p className="review-code">Place ID: {chosen.id}</p>
          <p className="review-code">{url}</p>
          <div className="store-actions">
            <button className="btn secondary" type="button" onClick={() => void copy(chosen.id, "id")}>{copied === "id" ? "Place ID copiado" : "Copiar Place ID"}</button>
            <button className="btn secondary" type="button" onClick={() => void copy(url, "url")}>{copied === "url" ? "Enlace copiado" : "Copiar enlace"}</button>
            <a className="btn secondary" href={url} target="_blank" rel="noopener noreferrer">Probar enlace</a>
            <button className="btn secondary" type="button" onClick={reset}>Generar nuevo enlace</button>
            <button className="btn" type="button" onClick={() => void loadPosters()}>Usar en un cartel ReviewsGO</button>
          </div>
        </section>
      ) : null}

      {url && posters ? (
        <section className="card-panel stack">
          <h2 style={{ margin: 0 }}>Asignar a un cartel</h2>
          <p className="muted" style={{ margin: 0 }}>
            Se guarda como destino del QR. El código impreso no cambia. Una etiqueta NFC grabada con el enlace público del cartel sigue ese destino. Si la etiqueta tiene una URL fija de Google, hay que reescribirla: el panel no la reprograma.
          </p>
          {posters.length === 0 ? (
            <p style={{ margin: 0 }}>No hay carteles en esta cuenta para configurar.</p>
          ) : (
            <label className="label">
              Cartel
              <select className="input" value={posterId} onChange={(event) => { setPosterId(event.target.value); setSaved(null); }}>
                <option value="">Elegí un cartel</option>
                {posters.map((item) => (
                  <option key={item.id} value={item.id} disabled={!admin && item.status === "bloqueado"}>
                    {codeOf(item)}{item.title ? ` · ${item.title}` : ""}{item.status === "bloqueado" ? " · Bloqueado" : ""}
                  </option>
                ))}
              </select>
            </label>
          )}
          <button className="btn" type="button" disabled={!poster || (!admin && poster.status === "bloqueado") || saving} onClick={() => void assign()}>
            {saving ? "Guardando destino..." : "Confirmar asignación"}
          </button>
          {saved ? (
            <div className="stack">
              <p style={{ color: "#137333", fontWeight: 650, margin: 0 }}>
                Destino guardado en {saved.code}. El QR impreso sigue siendo el mismo.
              </p>
              <div className="store-actions">
                <Link className="btn secondary" href={`/app/configurar/${saved.id}`}>Editar destino</Link>
                <a className="btn secondary" href={saved.publicPath} target="_blank" rel="noopener noreferrer">Probar el cartel</a>
              </div>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
