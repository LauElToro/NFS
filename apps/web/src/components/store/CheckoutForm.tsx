"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { StoreFrame } from "./StoreFrame";
import { readCartQuantity } from "@/lib/store-cart";
import { formatArs, quotePosters } from "@/lib/store-pricing";
import { buildOrderMessage, whatsAppOrderUrl, type WhatsAppOrder } from "@/lib/store-whatsapp";

type Quote = { quantity: number; unit: number; total: number; wholesale: boolean; listUnit?: number; savings?: number };
type Draft = {
  name: string;
  business: string;
  phone: string;
  email: string;
  state: string;
  city: string;
  street: string;
  zip: string;
  mode: "envio" | "retiro";
  notes: string;
};
type Field = keyof Draft;

const DRAFT_KEY = "reviewsgo-checkout";
const REQUEST_KEY = "reviewsgo-order-request";
const EMPTY: Draft = {
  name: "",
  business: "",
  phone: "",
  email: "",
  state: "",
  city: "",
  street: "",
  zip: "",
  mode: "envio",
  notes: "",
};

function loadDraft(): Draft {
  if (typeof window === "undefined") return EMPTY;
  try {
    const parsed = JSON.parse(window.sessionStorage.getItem(DRAFT_KEY) || "") as Partial<Draft>;
    return { ...EMPTY, ...parsed, mode: parsed.mode === "retiro" ? "retiro" : "envio" };
  } catch {
    return EMPTY;
  }
}

function requestId() {
  const current = window.sessionStorage.getItem(REQUEST_KEY) || "";
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(current)) return current;
  const next = crypto.randomUUID();
  window.sessionStorage.setItem(REQUEST_KEY, next);
  return next;
}

function validate(draft: Draft) {
  const errors: Partial<Record<Field, string>> = {};
  if (draft.name.trim().length < 2) errors.name = "Ingresá tu nombre y apellido.";
  if (draft.phone.trim().length < 6) errors.phone = "Ingresá un teléfono de contacto.";
  if (draft.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim())) errors.email = "El correo no es válido.";
  if (draft.state.trim().length < 2) errors.state = "Ingresá la provincia.";
  if (draft.city.trim().length < 2) errors.city = "Ingresá la localidad.";
  if (draft.mode === "envio" && draft.street.trim().length < 4) errors.street = "Ingresá la dirección de entrega.";
  if (draft.zip.trim() && (draft.zip.trim().length < 3 || draft.zip.trim().length > 12)) errors.zip = "El código postal no es válido.";
  if (draft.business.trim() && draft.business.trim().length < 2) errors.business = "El nombre del negocio es demasiado corto.";
  return errors;
}

export function CheckoutForm({ loggedIn }: { loggedIn: boolean }) {
  const [quantity, setQuantity] = useState(0);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<Field, string>>>({});
  const [step, setStep] = useState<"form" | "review">("form");
  const [submitting, setSubmitting] = useState(false);
  const [opened, setOpened] = useState("");
  const pending = useRef(false);

  useEffect(() => {
    setDraft(loadDraft());
    const current = readCartQuantity();
    setQuantity(current);
    if (!current) {
      setReady(true);
      return;
    }
    fetch("/api/store/quote", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ quantity: current }),
    })
      .then(async (res) => {
        const data = (await res.json()) as Quote & { error?: string };
        if (!res.ok) throw new Error(data.error || "No se pudo calcular el precio");
        setQuote(data);
      })
      .catch((reason: Error) => setError(reason.message))
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [draft]);

  const local = quotePosters(quantity);
  const shown = quote && quote.quantity === quantity ? quote : local;

  function update(field: Field, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setOpened("");
  }

  async function confirm() {
    if (pending.current || !shown) return;
    const popup = window.open("about:blank", "_blank");
    pending.current = true;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/store/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          requestId: requestId(),
          quantity: shown.quantity,
          name: draft.name,
          business: draft.business,
          phone: draft.phone,
          email: draft.email,
          state: draft.state,
          city: draft.city,
          street: draft.street,
          zip: draft.zip,
          mode: draft.mode,
          notes: draft.notes,
        }),
      });
      const data = (await res.json()) as { error?: string; order?: WhatsAppOrder };
      if (!res.ok || !data.order) throw new Error(data.error || "No se pudo registrar el pedido");
      const url = whatsAppOrderUrl(buildOrderMessage(data.order));
      setOpened(url);
      if (popup) popup.location.href = url;
      else setError("El navegador bloqueó la ventana. Usá el botón Abrir WhatsApp.");
    } catch (reason) {
      popup?.close();
      setError(reason instanceof Error ? reason.message : "No se pudo registrar el pedido");
    } finally {
      pending.current = false;
      setSubmitting(false);
    }
  }

  return (
    <StoreFrame loggedIn={loggedIn}>
      <main className="store-section">
        <h1>Finalizar compra</h1>
        {!ready ? <p className="muted">Calculando el total...</p> : null}
        {ready && !shown ? (
          <div className="store-card">
            <p>No hay carteles en el carrito. No se puede finalizar un pedido vacío.</p>
            <Link className="btn" href="/tienda">Volver a la tienda</Link>
          </div>
        ) : null}
        {ready && shown && !quote ? <p className="store-note">{error || "No se pudo calcular el precio."}</p> : null}
        {shown && quote && step === "form" ? (
          <form
            className="store-checkout"
            onSubmit={(event) => {
              event.preventDefault();
              const next = validate(draft);
              setFieldErrors(next);
              if (Object.keys(next).length) return;
              setStep("review");
            }}
          >
            <section className="store-card stack">
              <h2>Datos del cliente</h2>
              <label className="label">Nombre y apellido<input className="input" value={draft.name} autoComplete="name" onChange={(event) => update("name", event.target.value)} /></label>
              {fieldErrors.name ? <p style={{ color: "var(--danger)", margin: 0 }}>{fieldErrors.name}</p> : null}
              <label className="label">Nombre del negocio (opcional)<input className="input" value={draft.business} onChange={(event) => update("business", event.target.value)} /></label>
              {fieldErrors.business ? <p style={{ color: "var(--danger)", margin: 0 }}>{fieldErrors.business}</p> : null}
              <label className="label">Teléfono de contacto<input className="input" value={draft.phone} autoComplete="tel" onChange={(event) => update("phone", event.target.value)} /></label>
              {fieldErrors.phone ? <p style={{ color: "var(--danger)", margin: 0 }}>{fieldErrors.phone}</p> : null}
              <label className="label">Correo electrónico (opcional)<input className="input" type="email" value={draft.email} autoComplete="email" onChange={(event) => update("email", event.target.value)} /></label>
              {fieldErrors.email ? <p style={{ color: "var(--danger)", margin: 0 }}>{fieldErrors.email}</p> : null}
            </section>
            <section className="store-card stack">
              <h2>Entrega</h2>
              <div className="store-actions">
                <button className={draft.mode === "envio" ? "btn" : "btn secondary"} type="button" onClick={() => update("mode", "envio")}>Envío a domicilio</button>
                <button className={draft.mode === "retiro" ? "btn" : "btn secondary"} type="button" onClick={() => update("mode", "retiro")}>Retiro</button>
              </div>
              <label className="label">Provincia<input className="input" value={draft.state} autoComplete="address-level1" onChange={(event) => update("state", event.target.value)} /></label>
              {fieldErrors.state ? <p style={{ color: "var(--danger)", margin: 0 }}>{fieldErrors.state}</p> : null}
              <label className="label">Localidad<input className="input" value={draft.city} autoComplete="address-level2" onChange={(event) => update("city", event.target.value)} /></label>
              {fieldErrors.city ? <p style={{ color: "var(--danger)", margin: 0 }}>{fieldErrors.city}</p> : null}
              <label className="label">Dirección de entrega{draft.mode === "retiro" ? " (opcional)" : ""}<input className="input" value={draft.street} autoComplete="street-address" onChange={(event) => update("street", event.target.value)} /></label>
              {fieldErrors.street ? <p style={{ color: "var(--danger)", margin: 0 }}>{fieldErrors.street}</p> : null}
              <label className="label">Código postal (opcional)<input className="input" value={draft.zip} autoComplete="postal-code" onChange={(event) => update("zip", event.target.value)} /></label>
              {fieldErrors.zip ? <p style={{ color: "var(--danger)", margin: 0 }}>{fieldErrors.zip}</p> : null}
              <label className="label">Notas del pedido (opcional)<textarea className="input" rows={3} value={draft.notes} onChange={(event) => update("notes", event.target.value)} /></label>
            </section>
            <section className="store-card stack">
              <h2>Resumen</h2>
              <p>{quote.quantity} carteles × {formatArs(quote.unit)}</p>
              {quote.savings ? <p>Descuento del pack: {formatArs(quote.savings)}</p> : null}
              <strong>Total: {formatArs(quote.total)}</strong>
              <p className="muted">El pago y el costo del envío se coordinan por WhatsApp. Esta pantalla no cobra la compra.</p>
              <button className="btn" type="submit">Continuar por WhatsApp</button>
              <Link href="/carrito">Volver al carrito</Link>
            </section>
          </form>
        ) : null}
        {shown && quote && step === "review" ? (
          <section className="store-card stack">
            <h2>Revisá el pedido</h2>
            <p>Nombre: {draft.name.trim()}</p>
            <p>Negocio: {draft.business.trim() || "—"}</p>
            <p>Teléfono: {draft.phone.trim()}</p>
            <p>Email: {draft.email.trim() || "—"}</p>
            <p>Carteles ReviewsGO: {quote.quantity} unidades</p>
            <p>Precio por unidad: {formatArs(quote.unit)}</p>
            {quote.savings ? <p>Descuento del pack: {formatArs(quote.savings)}</p> : null}
            <p>Subtotal: {formatArs(quote.total)}</p>
            <strong>Total: {formatArs(quote.total)}</strong>
            <p>Modalidad: {draft.mode === "retiro" ? "Retiro" : "Envío a domicilio"}</p>
            <p>Provincia: {draft.state.trim()}</p>
            <p>Localidad: {draft.city.trim()}</p>
            <p>Dirección: {draft.street.trim() || "—"}</p>
            <p>Código postal: {draft.zip.trim() || "—"}</p>
            <p>Notas: {draft.notes.trim() || "Sin observaciones."}</p>
            <p className="muted">El pago y el costo del envío se coordinan por WhatsApp. El pedido queda pendiente de coordinación: no está pago ni confirmado.</p>
            {error ? <p style={{ color: "var(--danger)" }}>{error}</p> : null}
            {opened ? (
              <p className="store-note">
                WhatsApp se abrió con el mensaje escrito. Falta que pulses Enviar. El carrito sigue guardado por si volvés sin enviarlo.
              </p>
            ) : null}
            <div className="store-actions">
              <button className="btn secondary" type="button" onClick={() => { setStep("form"); setOpened(""); }}>Volver y modificar pedido</button>
              <button className="btn" type="button" disabled={submitting} onClick={() => void confirm()}>
                {submitting ? "Preparando WhatsApp..." : "Confirmar pedido por WhatsApp"}
              </button>
              {opened ? <a className="btn secondary" href={opened} target="_blank" rel="noopener noreferrer">Abrir WhatsApp</a> : null}
            </div>
          </section>
        ) : null}
      </main>
    </StoreFrame>
  );
}
