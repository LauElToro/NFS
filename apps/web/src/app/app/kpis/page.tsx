import { getContainer } from "@/lib/container";
import { requireSession } from "@/lib/session";

export default async function KpisPage() {
  const session = await requireSession();
  const kpis = await getContainer().getCommerceKpis.execute(session.id);

  return (
    <div className="stack" style={{ gap: "1.5rem" }}>
      <div>
        <h1 style={{ margin: "0 0 0.35rem" }}>KPIs del comercio</h1>
        <p className="muted" style={{ margin: 0 }}>
          Volumen de escaneo y perfil de audiencia para entender qué campañas
          rinden mejor.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "0.75rem",
        }}
      >
        <Stat label="Escaneos totales" value={String(kpis.totalScans)} />
        <Stat label="Visitantes únicos (aprox.)" value={String(kpis.uniqueVisitors)} />
        <Stat label="Últimos 7 días" value={String(kpis.scansLast7d)} />
        <Stat
          label="Mobile / Desktop / Tablet"
          value={`${kpis.byDevice.mobile} / ${kpis.byDevice.desktop} / ${kpis.byDevice.tablet}`}
        />
      </div>

      <div className="card-panel">
        <h2 style={{ marginTop: 0 }}>Insights</h2>
        {kpis.insights.length === 0 ? (
          <p className="muted">Todavía no hay suficientes escaneos.</p>
        ) : (
          <ul>
            {kpis.insights.map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="card-panel">
        <h2 style={{ marginTop: 0 }}>Ranking por campaña</h2>
        <div className="stack">
          {kpis.ranking.map((r) => (
            <div
              key={r.qrId}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: "0.75rem",
                borderTop: "1px solid var(--line)",
                paddingTop: "0.75rem",
              }}
            >
              <div>
                <strong>{r.title}</strong>
                <div className="muted">
                  {r.campaignLabel ?? "Sin campaña"} · /{r.slug}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>{r.scans} escaneos</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card-panel">
        <h2 style={{ marginTop: 0 }}>Escaneos por hora</h2>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 120 }}>
          {Array.from({ length: 24 }, (_, hour) => {
            const row = kpis.byHour.find((h) => h.hour === hour);
            const count = row?.count ?? 0;
            const max = Math.max(1, ...kpis.byHour.map((h) => h.count));
            const h = Math.round((count / max) * 100);
            return (
              <div
                key={hour}
                title={`${hour}:00 — ${count}`}
                style={{
                  flex: 1,
                  height: `${h}%`,
                  minHeight: count ? 4 : 1,
                  background: count ? "var(--accent)" : "var(--line)",
                  borderRadius: 2,
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card-panel">
      <div className="muted" style={{ fontSize: "0.85rem" }}>
        {label}
      </div>
      <div style={{ fontSize: "1.4rem", fontFamily: "var(--font-display)", marginTop: 4 }}>
        {value}
      </div>
    </div>
  );
}
