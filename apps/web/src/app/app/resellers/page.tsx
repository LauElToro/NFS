"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Reseller = {
  id: string;
  name: string;
  email: string;
  credits: number;
  active: boolean;
  qrCount: number;
};

type Pack = { code: string; credits: number; redeemedBy: string | null };

export default function ResellersPage() {
  const [items, setItems] = useState<Reseller[]>([]);
  const [packs, setPacks] = useState<Pack[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [credits, setCredits] = useState(30);
  const [error, setError] = useState<string | null>(null);
  const [freshCode, setFreshCode] = useState<string | null>(null);

  async function load() {
    const [usersRes, packsRes] = await Promise.all([fetch("/api/resellers"), fetch("/api/packs")]);
    if (!usersRes.ok) throw new Error("No se pudieron cargar los revendedores");
    setItems((await usersRes.json()) as Reseller[]);
    if (packsRes.ok) setPacks((await packsRes.json()) as Pack[]);
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
          Creá cuentas, asigná créditos y generá códigos de pack.
        </p>
      </div>

      <form
        className="card-panel stack"
        onSubmit={async (e) => {
          e.preventDefault();
          const res = await fetch("/api/resellers", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ name, email, password, credits }),
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
          <label className="label">
            Créditos
            <input className="input" type="number" min={0} value={credits} onChange={(e) => setCredits(Number(e.target.value))} />
          </label>
        </div>
        <button className="btn" type="submit">
          Crear revendedor
        </button>
      </form>

      <div className="card-panel stack">
        <h2 style={{ marginTop: 0 }}>Generar código de pack</h2>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {[30, 50, 100].map((amount) => (
            <button
              key={amount}
              className="btn secondary"
              type="button"
              onClick={async () => {
                const res = await fetch("/api/packs", {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({ credits: amount }),
                });
                const data = (await res.json().catch(() => null)) as Pack & { error?: string };
                if (!res.ok) {
                  setError(data?.error ?? "No se pudo generar");
                  return;
                }
                setFreshCode(data.code);
                await load();
              }}
            >
              Pack {amount}
            </button>
          ))}
        </div>
        {freshCode ? <p>Código nuevo: {freshCode}</p> : null}
        {packs.filter((pack) => !pack.redeemedBy).length > 0 ? (
          <p className="muted" style={{ margin: 0 }}>
            Sin usar: {packs.filter((pack) => !pack.redeemedBy).map((pack) => pack.code).join(", ")}
          </p>
        ) : null}
      </div>

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
                Créditos: {item.credits} · QR creados: {item.qrCount} · {item.active ? "Activo" : "Inactivo"}
              </p>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <Link className="btn secondary" href={`/app/resellers/${item.id}`}>
                Ver
              </Link>
              <button className="btn secondary" type="button" onClick={() => patch(item.id, { creditsDelta: 30 })}>
                +30
              </button>
              <button className="btn secondary" type="button" onClick={() => patch(item.id, { creditsDelta: -1 })}>
                −1
              </button>
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
