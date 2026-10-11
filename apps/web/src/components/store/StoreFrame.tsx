"use client";

import Link from "next/link";
import { useState } from "react";

export function StoreFrame({
  loggedIn,
  children,
}: {
  loggedIn: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

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
        <nav className={open ? "open" : ""} aria-label="Principal">
          <Link href="/#inicio" onClick={() => setOpen(false)}>Inicio</Link>
        </nav>
        <div className="store-tools">
          <Link className="store-panel" href={loggedIn ? "/app" : "/login"}>
            {loggedIn ? "Panel" : "Entrar"}
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
