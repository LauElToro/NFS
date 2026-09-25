import Link from "next/link";
import { getSession } from "@/lib/session";

export default async function HomePage() {
  const session = await getSession();

  return (
    <main>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "1.25rem 0",
        }}
        className="container"
      >
        <strong style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem" }}>
          NFS QR
        </strong>
        <nav style={{ display: "flex", gap: "0.75rem" }}>
          {session ? (
            <Link className="btn" href="/app">
              Ir al panel
            </Link>
          ) : (
            <>
              <Link className="btn secondary" href="/login">
                Entrar
              </Link>
              <Link className="btn" href="/register">
                Crear cuenta
              </Link>
            </>
          )}
        </nav>
      </header>

      <section
        className="container"
        style={{
          minHeight: "78vh",
          display: "grid",
          alignContent: "center",
          gap: "1.25rem",
          paddingBottom: "4rem",
          position: "relative",
        }}
      >
        <p
          className="muted"
          style={{
            margin: 0,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            fontSize: "0.8rem",
          }}
        >
          QRs dinámicos para comercios
        </p>
        <h1
          style={{
            margin: 0,
            fontSize: "clamp(2.8rem, 8vw, 5.5rem)",
            lineHeight: 0.95,
            maxWidth: "12ch",
          }}
        >
          NFS QR
        </h1>
        <p
          style={{
            margin: 0,
            maxWidth: "36rem",
            fontSize: "1.15rem",
            color: "var(--muted)",
            lineHeight: 1.5,
          }}
        >
          Imprimí una vez. Cambiá el destino cuando quieras. Medí escaneos y
          audiencia para entender qué campañas rinden mejor.
        </p>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <Link className="btn" href={session ? "/app" : "/login"}>
            {session ? "Abrir dashboard" : "Entrar al panel"}
          </Link>
        </div>
        <div
          aria-hidden
          style={{
            position: "absolute",
            right: "4%",
            bottom: "8%",
            width: "min(280px, 40vw)",
            aspectRatio: "1",
            borderRadius: "1.5rem",
            background:
              "linear-gradient(145deg, #c8f06c 0%, #7aa84a 45%, #1a221e 100%)",
            opacity: 0.85,
            boxShadow: "0 30px 80px rgba(0,0,0,0.45)",
            animation: "float 6s ease-in-out infinite",
          }}
        />
      </section>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(-4deg); }
          50% { transform: translateY(-14px) rotate(2deg); }
        }
      `}</style>
    </main>
  );
}
