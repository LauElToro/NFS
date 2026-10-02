"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { logoutAction } from "@/app/actions";

type Role = "admin" | "reseller";
type Toast = { id: number; message: string; tone: "ok" | "danger" | "warn" };

function Icon({ d }: { d: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d={d} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const ICONS = {
  panel: "M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z",
  qr: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14h2v2h-2zM14 18h2v2h-2zM18 18h2v2h-2z",
  people: "M16 20v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM20 20v-1a3.5 3.5 0 0 0-2.5-3.35M16.5 4.2a3 3 0 0 1 0 5.6",
  chart: "M4 19V5M4 19h16M8 16v-5M12 16V8M16 16v-3",
  bell: "M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15zM10 19a2 2 0 0 0 4 0",
  help: "M12 18h.01M9.1 9a3 3 0 1 1 3.9 2.8c-.8.4-1 1-1 1.7V14",
};

export function AppShell({
  name,
  email,
  role,
  children,
}: {
  name: string;
  email: string;
  role: Role;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [stuck, setStuck] = useState(false);
  const [help, setHelp] = useState(false);
  const [profile, setProfile] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [hash, setHash] = useState("");
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    setCollapsed(window.localStorage.getItem("nfs-sidebar") === "1");
    setHash(window.location.hash);
    const onHash = () => setHash(window.location.hash);
    const onScroll = () => setStuck(window.scrollY > 4);
    window.addEventListener("hashchange", onHash);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("hashchange", onHash);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    setNavOpen(false);
    setProfile(false);
    setNotesOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onToast(event: Event) {
      const detail = (event as CustomEvent<{ message?: string; tone?: Toast["tone"] }>).detail;
      if (!detail?.message) return;
      const id = Date.now() + Math.random();
      const toast = { id, message: detail.message, tone: detail.tone || "ok" };
      setToasts((current) => [...current, toast].slice(-5));
      window.setTimeout(() => setToasts((current) => current.filter((item) => item.id !== id)), 4600);
    }
    window.addEventListener("nfs-toast", onToast);
    return () => window.removeEventListener("nfs-toast", onToast);
  }, []);

  if (pathname.includes("/print")) return <>{children}</>;

  const links =
    role === "admin"
      ? [
          { href: "/app", label: "Panel", icon: ICONS.panel, match: pathname === "/app" && hash !== "#carteles" && hash !== "#asignar" },
          { href: "/app#carteles", label: "Carteles", icon: ICONS.qr, match: pathname === "/app" && hash === "#carteles" },
          { href: "/app#asignar", label: "Asignaciones", icon: ICONS.people, match: pathname === "/app" && hash === "#asignar" },
          { href: "/app/resellers", label: "Revendedores", icon: ICONS.people, match: pathname.startsWith("/app/resellers") },
          { href: "/app/kpis", label: "KPIs", icon: ICONS.chart, match: pathname.startsWith("/app/kpis") },
        ]
      : [{ href: "/app", label: "Mis carteles", icon: ICONS.qr, match: pathname === "/app" }];

  function search(event: FormEvent) {
    event.preventDefault();
    const value = query.trim();
    if (pathname === "/app") {
      window.dispatchEvent(new CustomEvent("nfs-search", { detail: value }));
      document.getElementById("carteles")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    window.sessionStorage.setItem("nfs-q", value);
    router.push("/app#carteles");
  }

  return (
    <div className={`shell${collapsed ? " collapsed" : ""}${navOpen ? " nav-open" : ""}`}>
      <button className="nav-backdrop" type="button" aria-label="Cerrar menú" onClick={() => setNavOpen(false)} />
      <aside className="sidebar">
        <Link href="/app" className="brand">
          <span className="brand-mark">N</span>
          <span className="brand-name">NFS QR</span>
        </Link>
        <nav aria-label="Secciones">
          {links.map((link) => (
            <Link key={link.href + link.label} href={link.href} className={`nav-link${link.match ? " active" : ""}`} aria-current={link.match ? "page" : undefined}>
              <Icon d={link.icon} />
              <span className="nav-label">{link.label}</span>
              <span className="nav-tip">{link.label}</span>
            </Link>
          ))}
        </nav>
        <div className="sidebar-foot">
          <button
            className="nav-link"
            type="button"
            onClick={() => {
              const next = !collapsed;
              setCollapsed(next);
              window.localStorage.setItem("nfs-sidebar", next ? "1" : "0");
            }}
          >
            <Icon d={collapsed ? "M9 6l6 6-6 6" : "M15 6l-6 6 6 6"} />
            <span className="nav-label">{collapsed ? "Expandir" : "Contraer"}</span>
          </button>
        </div>
      </aside>
      <div className="shell-main">
        <header className={`topbar${stuck ? " stuck" : ""}`}>
          <button className="btn secondary icon menu-toggle" type="button" aria-label="Abrir menú" onClick={() => setNavOpen(true)}>
            <Icon d="M4 7h16M4 12h16M4 17h16" />
          </button>
          <form className="topbar-search" onSubmit={search} role="search">
            <label className="label" style={{ margin: 0 }}>
              <span className="muted" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden" }}>
                Buscar cartel
              </span>
              <input className="input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar cartel, comercio o revendedor" />
            </label>
          </form>
          <div style={{ marginLeft: "auto", display: "flex", gap: "0.45rem", alignItems: "center" }}>
            <div className="top-slot">
              <button className="btn secondary icon" type="button" aria-label="Avisos" aria-expanded={notesOpen} onClick={() => { setNotesOpen((value) => !value); setProfile(false); }}>
                <Icon d={ICONS.bell} />
              </button>
              {notesOpen ? (
                <div className="popover" role="region" aria-label="Avisos">
                  {toasts.length === 0 ? <p className="muted" style={{ margin: 0 }}>No hay avisos nuevos.</p> : null}
                  {toasts.map((item) => (
                    <p key={item.id} style={{ margin: "0.35rem 0" }}>{item.message}</p>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="top-slot">
              <button className="btn secondary" type="button" aria-expanded={profile} onClick={() => { setProfile((value) => !value); setNotesOpen(false); }}>
                {name.split(" ")[0] || "Cuenta"}
              </button>
              {profile ? (
                <div className="popover" role="region" aria-label="Cuenta">
                  <strong>{name}</strong>
                  <p className="muted" style={{ margin: "0.25rem 0 0.75rem" }}>
                    {email}
                    <br />
                    {role === "admin" ? "Administrador" : "Revendedor"}
                  </p>
                  <form action={logoutAction}>
                    <button className="btn secondary" type="submit">Salir</button>
                  </form>
                </div>
              ) : null}
            </div>
          </div>
        </header>
        <div className="content">{children}</div>
      </div>
      <div className="fab-stack">
        <button className="btn secondary icon" type="button" aria-label="Ayuda" onClick={() => setHelp(true)}>
          <Icon d={ICONS.help} />
        </button>
        {role === "admin" && pathname === "/app" ? (
          <a className="btn" href="#crear">Crear cartel</a>
        ) : null}
      </div>
      {help ? (
        <div className="drawer-root">
          <button className="drawer-backdrop" type="button" aria-label="Cerrar ayuda" onClick={() => setHelp(false)} />
          <aside className="drawer" role="dialog" aria-modal="true" aria-label="Ayuda">
            <header>
              <h2 style={{ margin: 0 }}>Cómo funciona</h2>
              <button className="btn secondary icon" type="button" aria-label="Cerrar" onClick={() => setHelp(false)}>×</button>
            </header>
            <div className="stack">
              <p className="muted" style={{ margin: 0 }}>El administrador crea el stock. El QR impreso no cambia cuando se configura el destino.</p>
              <p className="muted" style={{ margin: 0 }}>Solo se pueden asignar carteles en estado Disponible.</p>
              <p className="muted" style={{ margin: 0 }}>El revendedor edita el destino de los carteles que recibió, salvo que estén bloqueados.</p>
            </div>
          </aside>
        </div>
      ) : null}
      <div className="toast-stack" aria-live="polite">
        {toasts.map((item) => (
          <div key={item.id} className={`toast ${item.tone}`} role="status">
            <span>{item.message}</span>
            <button className="btn secondary small" type="button" aria-label="Cerrar aviso" onClick={() => setToasts((current) => current.filter((toast) => toast.id !== item.id))}>
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
