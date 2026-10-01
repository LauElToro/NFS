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

  async function load() {
    const usersRes = await fetch("/api/resellers");
    if (!usersRes.ok) throw new Error("No se pudieron cargar los revendedores");
    setItems((await usersRes.json()) as Reseller[]);
  }

  useEffect(() => {
    load().catch((e: Error) => setError(e.message));
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
        className="card-panel stack"
        onSubmit={async (e) => {
          e.preventDefault();
          const res = await fetch("/api/resellers", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ name, email, password, credits: 0 }),
          });
          const data = (await res.json().catch(() => null)) as { error?: string } | null;
          if (!res.ok) {
            setError(data?.error ?? "No se pudo crear");
            return;
          }
          setName("");
          setEmail("");
          setPassword("");
          setError(null);
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
        <button className="btn" type="submit">
          Crear revendedor
        </button>
      </form>

      {error ? <p style={{ color: "var(--danger)" }}>{error}</p> : null}

      <div className="stack">
        {items.length === 0 ? <p className="muted">Todavía no hay revendedores.</p> : null}
        {items.map((item) => (
          <div key={item.id} className="card-panel stack">
            <div>
              <strong>{item.name}</strong>
              <p className="muted" style={{ margin: "0.25rem 0 0" }}>
                {item.email}
                <br />
                Carteles asignados: {item.qrCount} · {item.active ? "Activo" : "Inactivo"}
              </p>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <Link className="btn secondary" href={`/app/resellers/${item.id}`}>
                Ver carteles
              </Link>
              <button className="btn secondary" type="button" onClick={() => patch(item.id, { active: !item.active })}>
                {item.active ? "Desactivar" : "Activar"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
