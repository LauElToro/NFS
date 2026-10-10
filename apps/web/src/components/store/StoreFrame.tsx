"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { FLOATING_INQUIRY, whatsappHref } from "@/lib/catalog";

export function StoreFrame({
  loggedIn,
  children,
}: {
  loggedIn: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

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
          <Link href="/#inicio" aria-current={pathname === "/" ? "page" : undefined} onClick={() => setOpen(false)}>Inicio</Link>
          <Link href="/tienda" aria-current={pathname === "/tienda" ? "page" : undefined} onClick={() => setOpen(false)}>Tienda</Link>
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
      <a
        className="wa-float"
        href={whatsappHref(FLOATING_INQUIRY)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Consultar por WhatsApp sobre carteles NFC y QR"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M20.5 3.5A11 11 0 0 0 2.1 17.2L1 23l6-1.6A11 11 0 0 0 20.5 3.5zM12 20.5a9.1 9.1 0 0 1-4.6-1.3l-.3-.2-3.5.9.9-3.4-.2-.3A9.1 9.1 0 1 1 12 20.5zm5-6.8c-.3-.1-1.6-.8-1.8-.9s-.4-.1-.6.1-.7.9-.8 1-.3.2-.6.1a7.4 7.4 0 0 1-2.2-1.4 8.2 8.2 0 0 1-1.5-1.9c-.2-.3 0-.4.1-.6l.4-.4.2-.4a.5.5 0 0 0 0-.5c-.1-.1-.6-1.4-.8-1.9s-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4.1c.5.2 1 .4 1.5.5a3.6 3.6 0 0 0 1.7.1 2.7 2.7 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .2-1.3c-.1-.1-.3-.2-.6-.3z"
          />
        </svg>
      </a>
    </div>
  );
}
