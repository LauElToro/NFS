import {
  DESIGNS,
  PACKS,
  designInquiry,
  formatArs,
  packInquiry,
  whatsappHref,
  type CatalogDesign,
} from "@/lib/catalog";

function PosterMock({ design }: { design: CatalogDesign }) {
  return (
    <div className={`poster-mock poster-${design.id}`} aria-hidden="true">
      <span className="poster-corner tl" />
      <span className="poster-corner tr" />
      <span className="poster-corner bl" />
      <span className="poster-corner br" />
      <div className="poster-face">
        {design.id === "google" ? <img src="/reviewsgo-logo.png" alt="" /> : <span className={`poster-mark poster-mark-${design.id}`} />}
        <strong>{design.id === "google" ? "Dejanos tu reseña" : design.id === "instagram" ? "Conocé nuestro Instagram" : "Contactanos en WhatsApp"}</strong>
        {design.id === "google" ? <span className="poster-stars">★★★★★</span> : null}
        <span className="poster-qr" />
        <small>NFC</small>
      </div>
    </div>
  );
}

export function Catalog() {
  return (
    <main>
      <section className="home-hero catalog-hero">
        <div>
          <p className="store-kicker">Tienda ReviewsGO</p>
          <h1>Encontrá el cartel ideal para tu negocio</h1>
          <p>Facilitá las reseñas de Google y la conexión con tus clientes mediante carteles NFC y códigos QR.</p>
        </div>
        <div className="home-photo">
          <img src="/store/hero-posters.jpg" alt="Carteles ReviewsGO de Google Reviews, Instagram y WhatsApp" />
        </div>
      </section>
      <div className="store-stripe" aria-hidden="true" />

      <section className="store-section" aria-labelledby="disenos">
        <h2 id="disenos">Diseños</h2>
        <p className="catalog-lead">Elegí el modelo y consultanos por WhatsApp. El mismo formato sirve para sumar diseños nuevos.</p>
        <div className="catalog-designs">
          {DESIGNS.map((design) => (
            <article className="store-card catalog-card" key={design.id}>
              <PosterMock design={design} />
              <h3>{design.name}</h3>
              <p>{design.description}</p>
              <ul className="catalog-features">
                {design.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              <a
                className="btn"
                href={whatsappHref(designInquiry(design))}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Consultar el modelo ${design.name} por WhatsApp`}
              >
                Consultar por WhatsApp
              </a>
            </article>
          ))}
        </div>
      </section>

      <section className="store-section" aria-labelledby="packs">
        <h2 id="packs">Packs y precios</h2>
        <p className="catalog-lead">Precios en pesos argentinos. Los packs mayoristas no se combinan entre sí.</p>
        <div className="catalog-packs">
          {PACKS.map((pack) => (
            <article className={`store-card catalog-card catalog-pack${pack.wholesale ? " wholesale" : ""}`} key={pack.id}>
              <span className={`store-badge${pack.wholesale ? "" : " quiet"}`}>{pack.wholesale ? "Mayorista" : "Por unidad"}</span>
              <h3>{pack.name}</h3>
              <p className="store-total">{pack.detail}</p>
              {pack.total == null ? (
                <p className="store-unit">{formatArs(pack.unitPrice)} <small>por unidad</small></p>
              ) : (
                <>
                  <p className="store-unit">{formatArs(pack.total)} <small>total</small></p>
                  <p className="store-total">{formatArs(pack.unitPrice)} por unidad</p>
                </>
              )}
              <a
                className="btn"
                href={whatsappHref(packInquiry(pack))}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Consultar ${pack.name} por WhatsApp`}
              >
                {pack.wholesale ? "Consultar este pack" : "Consultar por WhatsApp"}
              </a>
            </article>
          ))}
        </div>
        <p className="store-note catalog-note">Los pedidos se coordinan directamente por WhatsApp. En el sitio no hay carrito, checkout ni pago.</p>
      </section>
    </main>
  );
}
