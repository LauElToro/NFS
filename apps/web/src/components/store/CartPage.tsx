"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { StoreFrame } from "./StoreFrame";
import { clearCart, readCartQuantity, writeCartQuantity } from "@/lib/store-cart";
import { formatArs, quotePosters } from "@/lib/store-pricing";

type ServerQuote = { quantity: number; unit: number; total: number; wholesale: boolean };

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
              {quoteError ? <p className="store-note">{quoteError}</p> : null}
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
