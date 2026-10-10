"use client";

import Link from "next/link";
import { useEffect } from "react";
import { StoreFrame } from "./StoreFrame";

function Icon({ d }: { d: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d={d} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const BENEFITS = [
  {
    title: "Más reseñas",
    text: "Facilitá que tus clientes encuentren el acceso para dejar una reseña en Google.",
    icon: "M12 3.5 14.1 8.8 19.8 9.2 15.4 12.8 16.8 18.4 12 15.4 7.2 18.4 8.6 12.8 4.2 9.2 9.9 8.8z",
  },
  {
    title: "Acceso rápido",
    text: "Conectá a tus clientes mediante tecnología NFC y códigos QR.",
    icon: "M8 8.5a6 6 0 0 1 8 0M6 6a9 9 0 0 1 12 0M9.5 11.2a3.2 3.2 0 0 1 5 0M12 14.2h.01",
  },
  {
    title: "Más conexiones",
    text: "Centralizá el acceso a tus redes sociales y canales de contacto.",
    icon: "M10 13a5 5 0 0 0 7.1.4l1.4-1.4a5 5 0 0 0-7.1-7.1l-.8.8M14 11a5 5 0 0 0-7.1-.4l-1.4 1.4a5 5 0 0 0 7.1 7.1l.8-.8",
  },
];

export function HomeLanding({ loggedIn }: { loggedIn: boolean }) {
  const accountHref = loggedIn ? "/app" : "/login";

  useEffect(() => {
    const hash = window.location.hash;
    if (hash === "#tienda" || hash === "#como-funciona" || hash === "#contacto") {
      window.location.replace(`/tienda${hash === "#tienda" ? "" : hash}`);
    }
  }, []);

  return (
    <StoreFrame loggedIn={loggedIn}>
      <main>
        <section className="home-hero" id="inicio">
          <div>
            <p className="store-kicker">Tecnología NFC + QR para tu negocio</p>
            <h1>Tu negocio merece más reseñas.</h1>
            <p>
              Conectá a tus clientes con tus reseñas de Google, redes sociales y canales de contacto con una experiencia rápida, simple y profesional.
            </p>
            <div className="store-actions">
              <Link className="btn" href={accountHref}>Acceder a mi cuenta</Link>
              <Link className="btn secondary" href="/tienda">Conocer nuestros productos</Link>
            </div>
          </div>
          <div className="home-photo">
            <img src="/store/hero-posters.jpg" alt="Carteles ReviewsGO de Google, Instagram y WhatsApp con QR y NFC" />
          </div>
        </section>
        <div className="store-stripe" aria-hidden />
        <section className="store-benefits home-benefits" aria-label="Beneficios">
          {BENEFITS.map((item) => (
            <article key={item.title}>
              <Icon d={item.icon} />
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </section>
        <section className="home-access">
          <div>
            <h2>Empezá a gestionar tu presencia digital.</h2>
            <p>Accedé a tu cuenta de ReviewsGO para administrar tus recursos y gestionar tu negocio.</p>
          </div>
          <Link className="btn" href={accountHref}>Iniciar sesión</Link>
        </section>
      </main>
    </StoreFrame>
  );
}
