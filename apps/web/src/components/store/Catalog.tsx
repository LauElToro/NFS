import {
  DESIGNS,
  FLOATING_INQUIRY,
  PACKS,
  designInquiry,
  formatArs,
  packInquiry,
  whatsappHref,
  type CatalogDesign,
} from "@/lib/catalog";

const DESIGN_IMAGES: Record<string, string> = {
  google: "/store/design-google.jpg",
  instagram: "/store/design-instagram.jpg",
  whatsapp: "/store/design-whatsapp.jpg",
};

function PosterPhoto({ design }: { design: CatalogDesign }) {
  return (
    <div className="poster-photo">
      <img src={DESIGN_IMAGES[design.id]} alt={`Cartel ${design.name}`} />
      <span className="poster-wordmark">ReviewsGO</span>
    </div>
  );
}

export function Catalog() {
  return (
    <main className="panel-catalog">
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
              <PosterPhoto design={design} />
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
    </main>
  );
}
