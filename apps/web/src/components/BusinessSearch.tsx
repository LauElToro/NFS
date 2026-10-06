"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { generateReviewUrl, getPlaceId, isReviewUrl } from "@/lib/places/review";
import type { BusinessPlace } from "@/lib/places/types";

type PosterOption = { id: string; cartelId?: string; title?: string; uniqueCode?: string };
type Confirmed = BusinessPlace & { reviewUrl: string };

const QR_PNG = { width: 512, margin: 2 };

function confirmPlace(place: BusinessPlace): Confirmed | null {
  try {
    const placeId = getPlaceId(place);
    return { ...place, placeId, reviewUrl: generateReviewUrl(placeId) };
  } catch {
    return null;
  }
}

async function generateQRCode(reviewUrl: string) {
  if (!isReviewUrl(reviewUrl)) throw new Error("URL de reseña inválida");
  return QRCode.toDataURL(reviewUrl, QR_PNG);
}

function toast(message: string, tone: "ok" | "danger" | "warn" = "ok") {
  window.dispatchEvent(new CustomEvent("nfs-toast", { detail: { message, tone } }));
}

export function BusinessSearch({ onApply }: { onApply?: (place: Confirmed) => void }) {
  const [query, setQuery] = useState("");
  const [places, setPlaces] = useState<BusinessPlace[]>([]);
  const [status, setStatus] = useState<"idle" | "short" | "loading" | "results" | "empty" | "error" | "found">("idle");
  const [message, setMessage] = useState("");
  const [selected, setSelected] = useState<Confirmed | null>(null);
  const [saving, setSaving] = useState(false);
  const [makingQr, setMakingQr] = useState(false);
  const [posters, setPosters] = useState<PosterOption[]>([]);
  const [posterId, setPosterId] = useState("");
  const [linking, setLinking] = useState(false);
  const [saved, setSaved] = useState<Confirmed[]>([]);
  const picked = useRef(false);

  useEffect(() => {
    if (onApply) return;
    fetch("/api/places")
      .then(async (res) => (res.ok ? ((await res.json()) as Confirmed[]) : []))
      .then(setSaved)
      .catch(() => setSaved([]));
  }, [onApply]);

  useEffect(() => {
    const text = query.trim();
    picked.current = false;
    setSelected(null);
    if (text.length < 3) {
      setPlaces([]);
      setStatus(text ? "short" : "idle");
      setMessage("");
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setStatus("loading");
      setMessage("");
      fetch(`/api/places/search?q=${encodeURIComponent(text)}`, { signal: controller.signal })
        .then(async (res) => {
          const data = (await res.json().catch(() => null)) as { places?: BusinessPlace[]; error?: string } | null;
          if (!res.ok) throw new Error(data?.error || "Error al buscar");
          if (picked.current) return;
          const next = data?.places ?? [];
          setPlaces(next);
          setStatus(next.length ? "results" : "empty");
        })
        .catch((error: Error) => {
          if (error.name === "AbortError" || picked.current) return;
          setPlaces([]);
          setStatus("error");
          setMessage(error.message || "Error al buscar");
        });
    }, 350);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  function choose(place: BusinessPlace) {
    const confirmed = confirmPlace(place);
    if (!confirmed) {
      setStatus("error");
      setMessage("Ese resultado no tiene un Place ID válido.");
      return;
    }
    picked.current = true;
    setPlaces([]);
    setSelected(confirmed);
    setStatus("found");
    setMessage("");
    onApply?.(confirmed);
    if (!onApply) {
      fetch("/api/qrs")
        .then(async (res) => (res.ok ? ((await res.json()) as PosterOption[]) : []))
        .then((items) => setPosters(Array.isArray(items) ? items : []))
        .catch(() => setPosters([]));
    }
  }

  async function copyLink() {
    if (!selected) return;
    try {
      await navigator.clipboard.writeText(selected.reviewUrl);
      toast("Enlace copiado");
    } catch {
      toast("No se pudo copiar el enlace", "danger");
    }
  }

  async function downloadQr() {
    if (!selected || makingQr) return;
    setMakingQr(true);
    try {
      const dataUrl = await generateQRCode(selected.reviewUrl);
      const link = document.createElement("a");
      link.href = dataUrl;
      const fileName = selected.name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^A-Za-z0-9]+/g, "_")
        .replace(/^_|_$/g, "");
      link.download = `${fileName || selected.placeId}.png`;
      link.click();
      toast("QR de reseña descargado");
    } catch {
      toast("No se pudo generar el QR", "danger");
    } finally {
      setMakingQr(false);
    }
  }

  async function save() {
    if (!selected || saving) return;
    setSaving(true);
    try {
      const res = await fetch("/api/places", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(selected),
      });
      const data = (await res.json().catch(() => null)) as { error?: string; duplicate?: boolean; business?: Confirmed } | null;
      if (!res.ok) {
        toast(data?.error || "No se pudo guardar", "danger");
        return;
      }
      if (data?.business) setSaved((current) => [data.business!, ...current.filter((item) => item.placeId !== data.business!.placeId)]);
      toast(data?.duplicate ? "Ese negocio ya estaba guardado" : "Negocio guardado", data?.duplicate ? "warn" : "ok");
    } finally {
      setSaving(false);
    }
  }

  async function linkPoster() {
    if (!selected || !posterId || linking) return;
    setLinking(true);
    try {
      const res = await fetch(`/api/qrs/${posterId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: selected.name, url: selected.reviewUrl, destinationType: "google" }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        toast(data?.error || "No se pudo asociar al cartel", "danger");
        return;
      }
      toast("La reseña quedó asociada al cartel");
    } finally {
      setLinking(false);
    }
  }

  return (
    <div className="stack">
      <label className="label">
        Buscar negocio
        <input
          className="input"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.preventDefault();
          }}
          placeholder="Buscar negocio, empresa o comercio..."
          autoComplete="off"
        />
      </label>
      <p className="muted" style={{ margin: 0 }}>
        Los resultados priorizan negocios de Argentina. Elegí el local correcto por la dirección.
      </p>

      {status === "short" ? <p className="muted" style={{ margin: 0 }}>Escribí al menos 3 caracteres.</p> : null}
      {status === "loading" ? <p className="place-note">Buscando...</p> : null}
      {status === "empty" ? <p className="place-note bad">Sin resultados</p> : null}
      {status === "error" ? <p className="place-note bad">Error al buscar. {message}</p> : null}

      {places.length > 0 ? (
        <div className="place-results" role="listbox" aria-label="Resultados">
          {places.map((place) => (
            <article key={place.placeId} className="place-hit card-panel">
              <strong>{place.name}</strong>
              {place.address ? <span>{place.address}</span> : null}
              {place.city && !place.address.includes(place.city) ? <span>{place.city}</span> : null}
              {place.category ? <span className="muted">{place.category}</span> : null}
              <button className="btn" type="button" onClick={() => choose(place)}>
                Seleccionar
              </button>
            </article>
          ))}
        </div>
      ) : null}

      {selected ? (
        <section className="card-panel stack">
          <p className="place-note">Negocio encontrado</p>
          <p className="place-note">Place ID obtenido correctamente</p>
          <p className="place-note">URL generada correctamente</p>
          <div>
            <div className="muted">Nombre</div>
            <strong>{selected.name}</strong>
          </div>
          <div>
            <div className="muted">Dirección</div>
            <span>{selected.address || selected.city || "Sin dirección"}</span>
          </div>
          <div>
            <div className="muted">Place ID</div>
            <code>{selected.placeId}</code>
          </div>
          <div>
            <div className="muted">URL de reseña</div>
            <a href={selected.reviewUrl} target="_blank" rel="noreferrer">
              {selected.reviewUrl}
            </a>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <button className="btn secondary" type="button" onClick={() => void copyLink()}>
              Copiar enlace
            </button>
            <a className="btn secondary" href={selected.reviewUrl} target="_blank" rel="noreferrer">
              Abrir enlace
            </a>
            <button className="btn" type="button" disabled={makingQr} aria-busy={makingQr} onClick={() => void downloadQr()}>
              Generar QR
            </button>
            <button className="btn secondary" type="button" disabled={saving} aria-busy={saving} onClick={() => void save()}>
              Guardar
            </button>
          </div>
          {onApply ? (
            <p className="muted" style={{ margin: 0 }}>
              La URL quedó en el destino de este cartel. Guardá los cambios para asociarla. El QR impreso sigue siendo /r/… y pasa a abrir esta reseña.
            </p>
          ) : (
            <div className="stack">
              <p className="muted" style={{ margin: 0 }}>
                El QR que se descarga abre directo la reseña. Si lo asociás a un cartel, el QR impreso no cambia y redirige a esta misma URL.
              </p>
              {posters.length === 0 ? (
                <p className="muted" style={{ margin: 0 }}>
                  No hay carteles para asociar. El administrador asigna el stock.
                </p>
              ) : (
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "end" }}>
                  <label className="label" style={{ flex: "1 1 220px", margin: 0 }}>
                    Cartel
                    <select className="input" value={posterId} onChange={(event) => setPosterId(event.target.value)}>
                      <option value="">Elegir cartel</option>
                      {posters.map((poster) => (
                        <option key={poster.id} value={poster.id}>
                          {poster.cartelId || poster.uniqueCode || poster.id}
                          {poster.title ? ` · ${poster.title}` : ""}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button className="btn" type="button" disabled={!posterId || linking} aria-busy={linking} onClick={() => void linkPoster()}>
                    Asociar al cartel
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
      ) : null}

      {!onApply && saved.length > 0 ? (
        <section className="stack">
          <h2 style={{ margin: 0 }}>Negocios guardados</h2>
          {saved.map((place) => (
            <article key={place.placeId} className="card-panel stack" style={{ margin: 0 }}>
              <strong>{place.name}</strong>
              <span className="muted">{place.address || place.city}</span>
              <code>{place.placeId}</code>
              <button className="btn secondary" type="button" onClick={() => choose(place)}>
                Usar
              </button>
            </article>
          ))}
        </section>
      ) : null}
    </div>
  );
}
