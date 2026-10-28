"use client";

import { useEffect, useState } from "react";
import {
  DESIGNS,
  FLOATING_INQUIRY,
  PACKS,
  designInquiry,
  formatArs,
  packInquiry,
  whatsappHref,
  type CatalogDesign,
  type CatalogPack,
} from "@/lib/catalog";
import { StoreFrame } from "./StoreFrame";

const PHOTOS: Record<string, string> = {
  google: "/store/design-google.jpg",
  instagram: "/store/design-instagram.jpg",
  whatsapp: "/store/design-whatsapp.jpg",
};

const FACTS = ["NFC y código QR", "PVC de 3 mm", "10 × 15 cm", "Soporte para superficie"];

const STEPS = [
  ["01", "Elegí tu cartel.", "Seleccioná Google, Instagram, WhatsApp u otra opción disponible."],
  ["02", "Tus clientes escanean o acercan su teléfono.", "Pueden utilizar el código QR o la tecnología NFC compatible."],
  ["03", "Acceden al destino configurado.", "Llegan a la página correspondiente para dejar una reseña, visitar un perfil o contactar al negocio."],
];

const retail = PACKS.find((pack) => pack.id === "retail") ?? PACKS[0];

function PackOffer({ pack }: { pack: CatalogPack }) {
  const [count, setCount] = useState(1);
  const total = pack.total ?? pack.unitPrice * count;

  return (
    <article className={`offer-card reveal${pack.featured ? " featured" : ""}`}>
      <span className="offer-tag">{pack.featured ? "Mayor volumen" : pack.wholesale ? "Mayorista" : "Individual"}</span>
      {pack.discount ? <span className="offer-off">{pack.discount}</span> : null}
      <h3>{pack.name}</h3>
      <p>{pack.detail}</p>
      {pack.quantity == null ? (
        <div className="pack-qty" role="group" aria-label="Cantidad de carteles">
          {[1, 2, 3, 4].map((value) => (
            <button key={value} type="button" className={value === count ? "on" : ""} aria-pressed={value === count} onClick={() => setCount(value)}>
              x{value}
            </button>
          ))}
        </div>
      ) : (
        <p className="offer-qty">{pack.quantity} carteles</p>
      )}
      <p className="offer-price">{formatArs(total)} <small>total</small></p>
      <p className="offer-unit">Precio unitario: {formatArs(pack.unitPrice)}</p>
      <a className="btn" href={whatsappHref(packInquiry(pack, pack.quantity == null ? count : undefined))} target="_blank" rel="noopener noreferrer">
        Consultar
      </a>
    </article>
  );
}

function ProductCard({ design }: { design: CatalogDesign }) {
  return (
    <article className="offer-card product-card reveal">
      <div className="product-photo">
        <img src={PHOTOS[design.id]} alt={`Cartel físico ${design.name} de ReviewsGO`} />
      </div>
      <h3>Cartel {design.name}</h3>
      <p>{design.description}</p>
      <ul>
        {FACTS.map((fact) => (
          <li key={fact}>{fact}</li>
        ))}
      </ul>
      <p className="offer-price">{formatArs(retail.unitPrice)} <small>por unidad</small></p>
      <a className="btn secondary" href={whatsappHref(designInquiry(design))} target="_blank" rel="noopener noreferrer">
        Consultar
      </a>
    </article>
  );
}

export function HomeLanding({ loggedIn }: { loggedIn: boolean }) {
  useEffect(() => {
    const nodes = document.querySelectorAll(".market .reveal");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      nodes.forEach((node) => node.classList.add("shown"));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("shown");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08 });
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  return (
    <StoreFrame loggedIn={loggedIn}>
      <noscript>
        <style>{`.market .reveal{opacity:1;transform:none}`}</style>
      </noscript>
      <main>
        <section className="market-hero" id="inicio">
          <div className="hero-glow" aria-hidden="true" />
          <div className="hero-copy reveal">
            <p className="store-kicker">Tecnología para hacer crecer tu negocio</p>
            <h1>Convertí cada visita en una <span className="grad">nueva oportunidad.</span></h1>
            <p>Carteles inteligentes con NFC y código QR para que tus clientes accedan fácilmente a tus reseñas, redes sociales y canales de contacto.</p>
            <div className="store-actions">
              <a className="btn" href="#productos">Ver productos</a>
              <a className="btn secondary" href="#como-funciona">Cómo funciona</a>
            </div>
            <ul className="hero-points">
              <li>Fácil de usar.</li>
              <li>Tecnología NFC + QR.</li>
              <li>Adaptable a diferentes negocios.</li>
            </ul>
          </div>
          <div className="hero-visual reveal">
            <img src="/store/hero-posters.jpg" alt="Carteles físicos ReviewsGO de Google, Instagram y WhatsApp con QR y NFC" />
          </div>
        </section>

        <section className="market-section" id="productos" aria-labelledby="productos-titulo">
          <div className="section-intro reveal">
            <h2 id="productos-titulo">Un cartel. Múltiples oportunidades.</h2>
            <p>Elegí la solución ideal para tu negocio.</p>
          </div>
          <div className="product-grid">
            {DESIGNS.map((design) => (
              <ProductCard key={design.id} design={design} />
            ))}
          </div>
        </section>

        <section className="market-section band" id="packs" aria-labelledby="packs-titulo">
          <div className="section-intro reveal">
            <h2 id="packs-titulo">Packs y precios</h2>
            <p>Precios en pesos argentinos, tomados de la lista publicada. Los packs mayoristas no se combinan entre sí.</p>
          </div>
          <div className="pack-grid">
            {PACKS.map((pack) => (
              <PackOffer key={pack.id} pack={pack} />
            ))}
          </div>
        </section>

        <section className="market-section" id="como-funciona" aria-labelledby="pasos-titulo">
          <div className="section-intro reveal">
            <h2 id="pasos-titulo">Cómo funciona</h2>
            <p>El cartel facilita el acceso. La reseña, la visita o el mensaje los hace la persona.</p>
          </div>
          <ol className="step-row">
            {STEPS.map(([number, title, text]) => (
              <li className="offer-card reveal" key={number}>
                <span>{number}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="market-section band" id="revendedores" aria-labelledby="reventa-titulo">
          <div className="reseller-panel reveal">
            <div>
              <h2 id="reventa-titulo">Llevá ReviewsGO a más negocios.</h2>
              <p>Ofrecé carteles inteligentes a comercios y construí tu propia cartera de clientes.</p>
              <ul>
                <li>Packs mayoristas publicados, de 5 a 100 carteles.</li>
                <li>Cada cartel conserva su QR y su NFC, aunque cambie el destino.</li>
                <li>El panel permite organizar los carteles asignados en carpetas privadas.</li>
              </ul>
            </div>
            <div className="store-actions">
              <a className="btn" href={whatsappHref("Hola, ReviewsGO. Quiero consultar por los packs mayoristas para revendedores.")} target="_blank" rel="noopener noreferrer">Consultar packs mayoristas</a>
              <a className="btn secondary" href={loggedIn ? "/app" : "/login"}>{loggedIn ? "Ir al panel" : "Entrar"}</a>
            </div>
          </div>
        </section>
      </main>
      <a className="wa-float" href={whatsappHref(FLOATING_INQUIRY)} target="_blank" rel="noopener noreferrer" aria-label="¿Tenés alguna consulta?" title="¿Tenés alguna consulta?">
        <span className="wa-tip">¿Tenés alguna consulta?</span>
        <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="currentColor" d="M20.5 3.5A11 11 0 0 0 2.1 17.2L1 23l6-1.6A11 11 0 0 0 20.5 3.5zM12 20.5a9.1 9.1 0 0 1-4.6-1.3l-.3-.2-3.5.9.9-3.4-.2-.3A9.1 9.1 0 1 1 12 20.5zm5-6.8c-.3-.1-1.6-.8-1.8-.9s-.4-.1-.6.1-.7.9-.8 1-.3.2-.6.1a7.4 7.4 0 0 1-2.2-1.4 8.2 8.2 0 0 1-1.5-1.9c-.2-.3 0-.4.1-.6l.4-.4.2-.4a.5.5 0 0 0 0-.5c-.1-.1-.6-1.4-.8-1.9s-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4.1c.5.2 1 .4 1.5.5a3.6 3.6 0 0 0 1.7.1 2.7 2.7 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .2-1.3c-.1-.1-.3-.2-.6-.3z" />
        </svg>
      </a>
    </StoreFrame>
  );
}
