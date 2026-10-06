"use client";

import { BusinessSearch } from "@/components/BusinessSearch";

export default function BusinessesPage() {
  return (
    <div className="stack" style={{ gap: "1.5rem" }}>
      <div>
        <h1 style={{ margin: "0 0 0.35rem" }}>Buscar negocio</h1>
        <p className="muted" style={{ margin: 0 }}>
          Escribí el nombre del local, elegí el resultado correcto y ReviewsGO arma el enlace de reseña con su Place ID.
        </p>
      </div>
      <section className="card-panel">
        <BusinessSearch />
      </section>
    </div>
  );
}
