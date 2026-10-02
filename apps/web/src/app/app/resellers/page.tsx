"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Reseller = {
  id: string;
  name: string;
  email: string;
  active: boolean;
  qrCount: number;
};

export default function ResellersPage() {
  const [items, setItems] = useState<Reseller[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [creating, setCreating] = useState(false);

  async function load() {
    const usersRes = await fetch("/api/resellers");
    if (!usersRes.ok) throw new Error("No se pudieron cargar los revendedores");
    setItems((await usersRes.json()) as Reseller[]);
  }

  useEffect(() => {
    load()
      .catch((e: Error) => setError(e.message))
      .finally(() => setReady(true));
  }, []);

  async function patch(id: string, body: Record<string, unknown>) {
    const res = await fetch(`/api/resellers/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    if (!res.ok) {
      setError(data?.error ?? "No se pudo actualizar");
      return;
    }
    setError(null);
    await load();
  }

  return (
    <div className="stack" style={{ gap: "1.5rem" }}>
      <div>
        <h1 style={{ margin: "0 0 0.35rem" }}>Revendedores</h1>
        <p className="muted" style={{ margin: 0 }}>
          Creá la cuenta y después asignale carteles desde el inventario. No se generan QR nuevos.
        </p>
      </div>

      <form
        id="nuevo-revendedor"
        className="card-panel stack"
        onSubmit={async (e) => {
          e.preventDefault();
          setCreating(true);
          const res = await fetch("/api/resellers", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ name, email, password, credits: 0 }),
          });
          const data = (await res.json().catch(() => null)) as { error?: string } | null;
          setCreating(false);
          if (!res.ok) {
            setError(data?.error ?? "No se pudo crear");
            return;
          }
          setName("");
          setEmail("");
          setPassword("");
          setError(null);
          window.dispatchEvent(new CustomEvent("nfs-toast", { detail: { message: "Revendedor creado correctamente", tone: "ok" } }));
          await load();
        }}
      >
        <h2 style={{ marginTop: 0 }}>Nuevo revendedor</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.75rem" }}>
          <label className="label">
            Nombre
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label className="label">
            Email
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label className="label">
            Contraseña
            <input className="input" type="text" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          </label>
        </div>
        <button className="btn" type="submit" disabled={creating} aria-busy={creating}>
          Crear revendedor
        </button>
      </form>

      {error ? <p style={{ color: "var(--danger)" }}>{error}</p> : null}

      {!ready ? <div className="skeleton lg" /> : null}
      {ready && items.length === 0 ? (
        <div className="empty-state card-panel">
          <span className="empty-icon" aria-hidden>R</span>
          <h2>No tenés revendedores todavía</h2>
          <p className="muted">Creá tu primer revendedor para comenzar.</p>
          <a className="btn" href="#nuevo-revendedor">Crear revendedor</a>
        </div>
      ) : null}
      {items.length > 0 ? (
        <>
          <div className="card-panel table-wrap only-desktop">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Carteles</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{item.email}</td>
                    <td>{item.qrCount}</td>
                    <td>{item.active ? "Activo" : "Inactivo"}</td>
                    <td>
                      <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                        <Link className="btn secondary small" href={`/app/resellers/${item.id}`}>Ver carteles</Link>
                        <button className="btn secondary small" type="button" onClick={() => patch(item.id, { active: !item.active })}>
                          {item.active ? "Desactivar" : "Activar"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="only-mobile stack">
            {items.map((item) => (
              <article key={item.id} className="card-panel stack">
                <strong>{item.name}</strong>
                <p className="muted" style={{ margin: 0 }}>
                  {item.email}
                  <br />
                  Carteles asignados: {item.qrCount} · {item.active ? "Activo" : "Inactivo"}
                </p>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  <Link className="btn secondary small" href={`/app/resellers/${item.id}`}>Ver carteles</Link>
                  <button className="btn secondary small" type="button" onClick={() => patch(item.id, { active: !item.active })}>
                    {item.active ? "Desactivar" : "Activar"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
