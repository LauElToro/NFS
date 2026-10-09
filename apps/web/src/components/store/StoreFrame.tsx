"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CART_EVENT, readCartQuantity } from "@/lib/store-cart";

export function StoreFrame({
  loggedIn,
  children,
}: {
  loggedIn: boolean;
  children: React.ReactNode;
}) {
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const sync = () => setCount(readCartQuantity());
    sync();
    window.addEventListener(CART_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CART_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return (
    <div className="store-page">
      <header className="store-header">
        <Link href="/" className="store-brand" aria-label="ReviewsGO">
          <img src="/reviewsgo-logo.png" alt="" />
          <span>ReviewsGO</span>
        </Link>
        <button className="store-menu" type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
          Menú
        </button>
        <nav className={open ? "open" : ""} aria-label="Tienda">
          <Link href="/#inicio" onClick={() => setOpen(false)}>Inicio</Link>
          <Link href="/#tienda" onClick={() => setOpen(false)}>Tienda</Link>
          <Link href="/#como-funciona" onClick={() => setOpen(false)}>Cómo funciona</Link>
          <Link href="/#contacto" onClick={() => setOpen(false)}>Contacto</Link>
        </nav>
        <div className="store-tools">
          <Link className="store-panel" href={loggedIn ? "/app" : "/login"}>
            {loggedIn ? "Panel" : "Entrar"}
          </Link>
          <Link className="store-cart" href="/carrito" aria-label={`Carrito, ${count} carteles`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <path d="M6 6h15l-1.5 9h-12z" strokeLinejoin="round" />
              <path d="M6 6 5 3H2" strokeLinecap="round" />
              <circle cx="9" cy="20" r="1.3" fill="currentColor" stroke="none" />
              <circle cx="18" cy="20" r="1.3" fill="currentColor" stroke="none" />
            </svg>
            <span>{count}</span>
          </Link>
        </div>
      </header>
      {children}
      <footer className="store-footer">
        <div>
          <img src="/reviewsgo-logo.png" alt="" />
          <strong>ReviewsGO</strong>
        </div>
        <p>Carteles NFC + QR para conseguir más reseñas.</p>
      </footer>
    </div>
  );
}
