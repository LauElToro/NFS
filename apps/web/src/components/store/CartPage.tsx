"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { StoreFrame } from "./StoreFrame";
import { clearCart, readCartQuantity, writeCartQuantity } from "@/lib/store-cart";
import { MAX_POSTERS, formatArs, quotePosters } from "@/lib/store-pricing";

type ServerQuote = { quantity: number; unit: number; total: number; wholesale: boolean; listUnit?: number; savings?: number };

export function CartPage({ loggedIn }: { loggedIn: boolean }) {
  const [quantity, setQuantity] = useState(0);
  const [draft, setDraft] = useState("1");
  const [server, setServer] = useState<ServerQuote | null>(null);
  const [quoteError, setQuoteError] = useState("");

  useEffect(() => {
    const current = readCartQuantity();
    setQuantity(current);
    setDraft(String(current || 1));
  }, []);

  useEffect(() => {
    if (!quantity) {
      setServer(null);
      return;
    }
    let active = true;
    fetch("/api/store/quote", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ quantity }),
    })
      .then(async (res) => {
        const data = (await res.json()) as ServerQuote & { error?: string };
        if (!res.ok) throw new Error(data.error || "No se pudo calcular el precio");
        if (active) {
          setServer(data);
          setQuoteError("");
        }
      })
      .catch((reason: Error) => {
        if (active) setQuoteError(reason.message);
      });
    return () => {
      active = false;
    };
  }, [quantity]);

  const local = quotePosters(quantity);
  const quote = server && server.quantity === quantity ? server : local;

  function applyQuantity(value: number) {
    const next = writeCartQuantity(value);
    setQuantity(next);
    setDraft(String(next || value));
  }

  return (
    <StoreFrame loggedIn={loggedIn}>
      <main className="store-section">
        <h1>Carrito</h1>
        {!quote ? (
          <div className="store-card">
            <p>Tu carrito está vacío.</p>
            <Link className="btn" href="/tienda">Volver a la tienda</Link>
          </div>
        ) : (
          <div className="store-card store-cart-line">
            <img src="/store/hero-posters.jpg" alt="" />
            <div>
              <h2>Carteles ReviewsGO</h2>
              <p>{quote.wholesale ? "Precio mayorista según la cantidad" : "Precio minorista"}</p>
              <div className="store-actions">
                <button className="btn secondary" type="button" aria-label="Disminuir cantidad" disabled={quantity <= 1} onClick={() => applyQuantity(quantity - 1)}>−</button>
                <label className="label" style={{ margin: 0 }}>
                  Cantidad
                  <input
                    className="input"
                    type="number"
                    min={1}
                    max={MAX_POSTERS}
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onBlur={() => {
                      const next = quotePosters(Number(draft));
                      if (!next) {
                        setDraft(String(quantity));
                        return;
                      }
                      applyQuantity(next.quantity);
                    }}
                  />
                </label>
                <button className="btn secondary" type="button" aria-label="Aumentar cantidad" disabled={quantity >= MAX_POSTERS} onClick={() => applyQuantity(quantity + 1)}>+</button>
              </div>
              {quoteError ? <p className="store-note">{quoteError}</p> : null}
              <p>Unidades: {quote.quantity}</p>
              <p>Precio por unidad: {formatArs(quote.unit)}</p>
              {quote.savings ? <p>Descuento del pack: {formatArs(quote.savings)}</p> : null}
              <p>Subtotal: {formatArs(quote.total)}</p>
              <strong>Total: {formatArs(quote.total)}</strong>
              <div className="store-actions">
                <button className="btn secondary" type="button" onClick={() => { clearCart(); setQuantity(0); }}>
                  Eliminar
                </button>
                <button className="btn secondary" type="button" onClick={() => { clearCart(); setQuantity(0); }}>
                  Vaciar carrito
                </button>
                <Link className="btn" href="/checkout">Finalizar compra</Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </StoreFrame>
  );
}
