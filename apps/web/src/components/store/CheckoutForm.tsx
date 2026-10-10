"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { StoreFrame } from "./StoreFrame";
import { clearCart, readCartQuantity } from "@/lib/store-cart";
import { formatArs, quotePosters } from "@/lib/store-pricing";

type Quote = { quantity: number; unit: number; total: number; wholesale: boolean; payments: string[] };
type SavedOrder = { id: string; quantity: number; unit: number; total: number };

export function CheckoutForm({ loggedIn }: { loggedIn: boolean }) {
  const [quantity, setQuantity] = useState(0);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [order, setOrder] = useState<SavedOrder | null>(null);
  const [requestId] = useState(() => crypto.randomUUID());
  const pending = useRef(false);

  useEffect(() => {
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

  const local = quotePosters(quantity);

  return (
    <StoreFrame loggedIn={loggedIn}>
      <main className="store-section">
        <h1>Checkout</h1>
        {!ready ? <p className="muted">Calculando el total...</p> : null}
        {ready && !local ? (
          <div className="store-card">
            <p>No hay carteles en el carrito.</p>
            <Link className="btn" href="/tienda">Ver precios y packs</Link>
          </div>
        ) : null}
        {ready && local && !quote ? <p className="store-note">{error || "No se pudo calcular el precio."}</p> : null}
        {local && quote ? (
          <form
            className="store-checkout"
            onSubmit={async (event) => {
              event.preventDefault();
              if (pending.current || order) return;
              pending.current = true;
              const form = new FormData(event.currentTarget);
              setSubmitting(true);
              setError("");
              try {
                const res = await fetch("/api/store/orders", {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({
                    requestId,
                    quantity,
                    name: form.get("name"),
                    email: form.get("email"),
                    phone: form.get("phone"),
                    street: form.get("street"),
                    city: form.get("city"),
                    state: form.get("state"),
                    zip: form.get("zip"),
                  }),
                });
                const data = (await res.json()) as { error?: string; order?: SavedOrder; payments?: string[] };
                if (!res.ok || !data.order) throw new Error(data.error || "No se pudo registrar el pedido");
                clearCart();
                setOrder(data.order);
              } catch (reason) {
                setError(reason instanceof Error ? reason.message : "No se pudo registrar el pedido");
              } finally {
                pending.current = false;
                setSubmitting(false);
              }
            }}
          >
            <section className="store-card stack">
              <h2>Datos del comprador</h2>
              <label className="label">Nombre<input className="input" name="name" required autoComplete="name" /></label>
              <label className="label">Email<input className="input" name="email" type="email" required autoComplete="email" /></label>
              <label className="label">Teléfono<input className="input" name="phone" required autoComplete="tel" /></label>
            </section>
            <section className="store-card stack">
              <h2>Dirección de envío</h2>
              <label className="label">Calle y número<input className="input" name="street" required autoComplete="street-address" /></label>
              <label className="label">Ciudad<input className="input" name="city" required autoComplete="address-level2" /></label>
              <label className="label">Provincia<input className="input" name="state" required autoComplete="address-level1" /></label>
              <label className="label">Código postal<input className="input" name="zip" required autoComplete="postal-code" /></label>
            </section>
            <section className="store-card stack">
              <h2>Resumen</h2>
              <p>{quote.quantity} carteles × {formatArs(quote.unit)}</p>
              <p>{quote.wholesale ? "Precio mayorista de esta cantidad" : "Precio minorista"}</p>
              <strong>Total: {formatArs(quote.total)}</strong>
              <p className="muted">Se aplica una sola tarifa, la de esta cantidad. No se acumulan descuentos.</p>
              {quote.payments.length === 0 ? (
                <p className="muted">No hay un método de pago configurado. El pedido se registra, pero el pago queda sin confirmar.</p>
              ) : null}
              {error ? <p style={{ color: "var(--danger)" }}>{error}</p> : null}
              {order ? (
                <p className="store-note">
                  Pedido {order.id} registrado: {order.quantity} carteles, total {formatArs(order.total)}. El pago no está aprobado porque falta un proveedor de cobros.
                </p>
              ) : (
                <button className="btn" type="submit" disabled={submitting}>
                  {submitting ? "Registrando pedido..." : "Confirmar pedido"}
                </button>
              )}
              <Link href={order ? (loggedIn ? "/app/tienda" : "/tienda") : "/carrito"}>{order ? "Volver a la tienda" : "Volver al carrito"}</Link>
            </section>
          </form>
        ) : null}
      </main>
    </StoreFrame>
  );
}
