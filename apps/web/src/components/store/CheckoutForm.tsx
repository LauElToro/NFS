"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { StoreFrame } from "./StoreFrame";
import { readCartQuantity } from "@/lib/store-cart";
import { formatArs, quotePosters } from "@/lib/store-pricing";

type Quote = { quantity: number; unit: number; total: number; wholesale: boolean; payments: string[] };

export function CheckoutForm({ loggedIn }: { loggedIn: boolean }) {
  const [quantity, setQuantity] = useState(0);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [blocked, setBlocked] = useState(false);

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
            <Link className="btn" href="/#tienda">Ver precios y packs</Link>
          </div>
        ) : null}
        {local && quote ? (
          <form
            className="store-checkout"
            onSubmit={(event) => {
              event.preventDefault();
              setBlocked(true);
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
              {quote.payments.length === 0 ? (
                <p className="muted">No hay un método de pago configurado. El pedido no se cobra ni queda confirmado.</p>
              ) : null}
              {error ? <p style={{ color: "var(--danger)" }}>{error}</p> : null}
              {blocked ? (
                <p className="store-note">Los datos quedaron en esta pantalla. Sin un medio de pago operativo no se registra ni se confirma la compra.</p>
              ) : (
                <button className="btn" type="submit">Revisar pedido</button>
              )}
              <Link href="/carrito">Volver al carrito</Link>
            </section>
          </form>
        ) : null}
      </main>
    </StoreFrame>
  );
}
