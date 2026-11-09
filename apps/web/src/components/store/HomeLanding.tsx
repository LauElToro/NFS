"use client";

import { useEffect } from "react";
import {
  DESIGNS,
  FLOATING_INQUIRY,
  PACKS,
  PACK_BADGES,
  designInquiry,
  formatArs,
  listTotal,
  packDiscountPercent,
  packInquiry,
  packSavings,
  whatsappHref,
  type CatalogDesign,
  type CatalogPack,
} from "@/lib/catalog";
import { StoreFrame } from "./StoreFrame";

const PHOTOS: Record<string, string> = {
  google: "/store/design-google.jpg",
  instagram: "/store/design-instagram.png",
  whatsapp: "/store/design-whatsapp.png",
};

const FACTS = ["NFC y código QR", "PVC de 3 mm", "10 × 15 cm", "Soporte para superficie"];

const STEPS = [
  ["01", "Elegí tu cartel.", "Seleccioná Google, Instagram, WhatsApp u otra opción disponible."],
  ["02", "Tus clientes escanean o acercan su teléfono.", "Pueden utilizar el código QR o la tecnología NFC compatible."],
  ["03", "Acceden al destino configurado.", "Llegan a la página correspondiente para dejar una reseña, visitar un perfil o contactar al negocio."],
];

const retail = PACKS.find((pack) => pack.id === "retail") ?? PACKS[0];

function PackOffer({ pack }: { pack: CatalogPack }) {
  const compared = listTotal(pack);
  const percent = packDiscountPercent(pack);
  const savings = packSavings(pack);
  const tone = pack.badge === "descuento" || percent >= 54 ? " featured" : pack.badge === "elegido" ? " chosen" : "";

  return (
    <article className={`offer-card reveal${tone}`}>
      <span className="offer-tag">{pack.badge ? PACK_BADGES[pack.badge] : pack.wholesale ? "Mayorista" : "Minorista"}</span>
      {percent > 0 ? <span className="offer-off">{percent}% OFF</span> : null}
      <h3>{pack.name}</h3>
      <p className="offer-qty">{pack.detail}</p>
      {percent > 0 ? <p className="offer-was"><s>{formatArs(compared)}</s></p> : null}
      <p className="offer-price">{formatArs(pack.total)} <small>total</small></p>
      <p className="offer-unit">Precio unitario: {formatArs(pack.unitPrice)}</p>
      {savings > 0 ? <p className="offer-save">Ahorrás {formatArs(savings)}</p> : null}
      <a className="btn" href={whatsappHref(packInquiry(pack))} target="_blank" rel="noopener noreferrer">
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
            <div className="hero-stage">
              <p className="hero-stage-kicker">Presentación interactiva</p>
              <h2>Explorá los carteles NFC + QR</h2>
              <p>Abrí la presentación para recorrer las variantes de ReviewsGO y ver cómo el cliente pasa del cartel a la reseña.</p>
              <ul className="hero-stage-points">
                <li>Google, Instagram y WhatsApp</li>
                <li>Demos de NFC y QR</li>
              </ul>
              <a
                className="btn hero-play"
                href="https://claude.ai/artifact/8oX7QZANmh4rDWudkEG6wE"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M9 7.5v9l8-4.5-8-4.5z" />
                </svg>
                Iniciar presentación
              </a>
              <p className="hero-stage-note">Se abre en una pestaña nueva. ReviewsGO queda abierto en esta.</p>
            </div>
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
            <h2 id="packs-titulo">Precios minoristas y mayoristas</h2>
            <p className="pack-slogan">Cuantos más carteles comprás, menos pagás por unidad.</p>
            <p>Elegí tu pack ideal y comenzá a potenciar las reseñas de tu negocio con ReviewsGO.</p>
          </div>
          <div className="pack-groups">
            <div>
              <h3>Minorista</h3>
              <div className="pack-grid compact">
                {PACKS.filter((pack) => !pack.wholesale).map((pack) => (
                  <PackOffer key={pack.id} pack={pack} />
                ))}
              </div>
            </div>
            <div>
              <h3>Mayorista</h3>
              <div className="pack-grid">
                {PACKS.filter((pack) => pack.wholesale).map((pack) => (
                  <PackOffer key={pack.id} pack={pack} />
                ))}
              </div>
            </div>
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
