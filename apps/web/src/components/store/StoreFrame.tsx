"use client";

import Link from "next/link";
import { useState } from "react";
import { FLOATING_INQUIRY, whatsappHref } from "@/lib/catalog";

const LINKS = [
  ["#inicio", "Inicio"],
  ["#productos", "Productos"],
  ["#packs", "Packs y precios"],
  ["#como-funciona", "Cómo funciona"],
  ["#revendedores", "Revendedores"],
  ["#contacto", "Contacto"],
];

export function StoreFrame({
  loggedIn,
  children,
}: {
  loggedIn: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <div className="store-page market">
      <header className="site-nav">
        <div className="site-nav-inner">
          <Link href="/#inicio" className="logo-word" aria-label="ReviewsGO" onClick={close}>
            Reviews<span>GO</span>
          </Link>
          <button className="nav-toggle" type="button" aria-expanded={open} aria-controls="site-menu" onClick={() => setOpen((value) => !value)}>
            {open ? "Cerrar" : "Menú"}
          </button>
          <nav id="site-menu" className={open ? "open" : ""} aria-label="Principal">
            {LINKS.map(([href, label]) => (
              <a key={href} href={href} onClick={close}>{label}</a>
            ))}
            <a className="nav-wa" href={whatsappHref(FLOATING_INQUIRY)} target="_blank" rel="noopener noreferrer" onClick={close}>
              Consultar por WhatsApp
            </a>
          </nav>
          <div className="site-nav-tools">
            <Link className="site-enter" href={loggedIn ? "/app" : "/login"} onClick={close}>
              {loggedIn ? "Panel" : "Entrar"}
            </Link>
            <a className="btn site-nav-cta" href={whatsappHref(FLOATING_INQUIRY)} target="_blank" rel="noopener noreferrer">
              Consultar por WhatsApp
            </a>
          </div>
        </div>
      </header>
      {children}
      <footer className="site-foot" id="contacto">
        <div className="site-foot-grid">
          <div>
            <p className="logo-word">Reviews<span>GO</span></p>
            <p>Carteles NFC + QR para que tus clientes lleguen a tus reseñas, redes y canales de contacto.</p>
          </div>
          <nav aria-label="Secciones">
            {LINKS.map(([href, label]) => (
              <a key={href} href={href}>{label}</a>
            ))}
          </nav>
          <div>
            <a href={whatsappHref(FLOATING_INQUIRY)} target="_blank" rel="noopener noreferrer">WhatsApp</a>
            <Link href={loggedIn ? "/app" : "/login"}>{loggedIn ? "Ir al panel" : "Entrar"}</Link>
            <p>Los pedidos se coordinan por WhatsApp. En el sitio no hay carrito ni pago.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
