"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { StoreFrame } from "./StoreFrame";
import { clearCart, readCartQuantity, writeCartQuantity } from "@/lib/store-cart";
import { formatArs, quotePosters } from "@/lib/store-pricing";

export function CartPage({ loggedIn }: { loggedIn: boolean }) {
  const [quantity, setQuantity] = useState(0);
  const [draft, setDraft] = useState("1");

  useEffect(() => {
    const current = readCartQuantity();
    setQuantity(current);
    setDraft(String(current || 1));
  }, []);

  const quote = quotePosters(quantity);

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
            <p>El carrito está vacío.</p>
            <Link className="btn" href="/#tienda">Ver precios y packs</Link>
          </div>
        ) : (
          <div className="store-card store-cart-line">
            <img src="/store/hero-posters.jpg" alt="" />
            <div>
              <h2>Carteles NFC + QR</h2>
              <p>{quote.wholesale ? "Precio mayorista según la cantidad" : "Precio minorista"}</p>
              <label className="label">
                Cantidad
                <input
                  className="input"
                  type="number"
                  min={1}
                  max={100}
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
              <p>Precio unitario: {formatArs(quote.unit)}</p>
              <p>Subtotal: {formatArs(quote.total)}</p>
              <strong>Total: {formatArs(quote.total)}</strong>
              <div className="store-actions">
                <button className="btn secondary" type="button" onClick={() => { clearCart(); setQuantity(0); }}>
                  Eliminar
                </button>
                <Link className="btn" href="/checkout">Continuar al checkout</Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </StoreFrame>
  );
}
