"use client";

import Link from "next/link";
import { useState } from "react";
import { StoreFrame } from "./StoreFrame";
import { addPackQuantity } from "@/lib/store-cart";
import { STORE_PACKS, formatArs } from "@/lib/store-pricing";

export function StoreHome({ loggedIn }: { loggedIn: boolean }) {
  const [filter, setFilter] = useState<"todos" | "minorista" | "mayorista">("todos");
  const [notice, setNotice] = useState("");
  const packs = STORE_PACKS.filter((pack) => {
    if (filter === "minorista") return !pack.wholesale;
    if (filter === "mayorista") return pack.wholesale;
    return true;
  });

  return (
    <StoreFrame loggedIn={loggedIn}>
      <main>
        <section className="store-hero" id="inicio">
          <div>
            <p className="store-kicker">Carteles NFC + QR</p>
            <h1>Más reseñas. Más clientes. Más crecimiento.</h1>
            <p>
              Facilitá que tus clientes encuentren tus reseñas, redes sociales y canales de contacto con carteles NFC + QR.
            </p>
            <a className="btn" href="#tienda">Ver precios y packs</a>
          </div>
          <img src="/store/hero-posters.jpg" alt="Carteles ReviewsGO de Google, Instagram y WhatsApp con QR y NFC" />
        </section>
        <div className="store-stripe" aria-hidden />

        <section className="store-section" id="tienda">
          <div className="store-section-head">
            <div>
              <p className="store-kicker">Nuestros precios</p>
              <h2>Elegí el pack que mejor se adapte a tu negocio</h2>
            </div>
            <div className="store-switch" role="group" aria-label="Tipo de precio">
              <button className={filter !== "mayorista" ? "on" : ""} type="button" onClick={() => setFilter(filter === "minorista" ? "todos" : "minorista")}>
                Precio minorista
              </button>
              <button className={filter === "mayorista" ? "on" : ""} type="button" onClick={() => setFilter(filter === "mayorista" ? "todos" : "mayorista")}>
                Precio mayorista
              </button>
            </div>
          </div>
          <p className="muted">Cuantos más carteles, menor es el precio por unidad. El total se calcula con la cantidad del carrito.</p>
          {notice ? <p className="store-note">{notice}</p> : null}
          <div className="store-grid">
            {packs.map((pack) => (
              <article key={pack.id} className="store-card">
                {pack.wholesale ? <span className="store-badge">Precio mayorista</span> : <span className="store-badge quiet">Precio minorista</span>}
                <h3>{pack.name}</h3>
                <p className="store-unit">{formatArs(pack.unit)} <small>c/u</small></p>
                <p className="store-total">{pack.total ? `Total: ${formatArs(pack.total)}` : "Elegí de 1 a 4 en el carrito"}</p>
                <img src="/store/hero-posters.jpg" alt="" />
                <button
                  className="btn"
                  type="button"
                  onClick={() => {
                    const quantity = addPackQuantity(pack.quantity);
                    setNotice(quantity ? `Carrito actualizado: ${quantity} cartel${quantity === 1 ? "" : "es"}.` : "No se pudo agregar.");
                  }}
                >
                  {pack.wholesale ? "Comprar pack" : "Comprar ahora"}
                </button>
              </article>
            ))}
            <article className="store-card store-specs">
              <h3>Carteles de alta calidad, listos para usar</h3>
              <ul>
                <li>PVC de 10 x 15 cm</li>
                <li>Espesor 3 mm</li>
                <li>NFC + QR</li>
                <li>Diseños para Google, Instagram y WhatsApp</li>
                <li>Listos para tu negocio</li>
              </ul>
              <img className="store-wordmark" src="/reviewsgo-logo.png" alt="ReviewsGO" />
            </article>
          </div>
        </section>

        <section className="store-section" id="como-funciona">
          <p className="store-kicker">Cómo funciona</p>
          <h2>Del pack al cartel, sin reimprimir el QR</h2>
          <div className="store-steps">
            <article>
              <strong>1</strong>
              <h3>Elegís la cantidad</h3>
              <p>El precio por unidad baja en los packs de 5, 10, 20, 50, 75 y 100.</p>
            </article>
            <article>
              <strong>2</strong>
              <h3>Recibís los carteles</h3>
              <p>Cada cartel físico conserva su QR. El destino se cambia después, desde el panel.</p>
            </article>
            <article>
              <strong>3</strong>
              <h3>Configurás el destino</h3>
              <p>Reseña de Google, Instagram, WhatsApp u otro enlace. El impreso no cambia.</p>
            </article>
          </div>
        </section>

        <section className="store-benefits" id="contacto">
          <article><span aria-hidden>⌁</span><h3>NFC + QR en un solo cartel</h3><p>El cliente acerca el teléfono o escanea el código.</p></article>
          <article><span aria-hidden>✦</span><h3>Diseños profesionales</h3><p>Carteles listos para Google, Instagram y WhatsApp.</p></article>
          <article><span aria-hidden>↪</span><h3>Envíos a todo el país</h3><p>La dirección se carga en el checkout, antes de pagar.</p></article>
          <article><span aria-hidden>○</span><h3>Atención y soporte personalizado</h3><p>El panel queda para configurar cada cartel cuando llega.</p></article>
        </section>
        <p className="store-contact">
          Para comprar, agregá un pack al <Link href="/carrito">carrito</Link>. Si ya tenés cuenta, entrá al <Link href={loggedIn ? "/app" : "/login"}>panel</Link>.
        </p>
      </main>
    </StoreFrame>
  );
}
