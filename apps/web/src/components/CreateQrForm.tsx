"use client";

import { useState, useTransition } from "react";

type ActionResult = { error?: string } | void;

export function CreateQrForm({
  action,
}: {
  action: (form: FormData) => Promise<ActionResult>;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <form
      className="stack"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        start(async () => {
          const res = await action(fd);
          if (res && "error" in res && res.error) setError(res.error);
          else e.currentTarget.reset();
        });
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "0.75rem",
        }}
      >
        <label className="label">
          Título
          <input className="input" name="title" required placeholder="Menú terraza" />
        </label>
        <label className="label">
          URL destino
          <input
            className="input"
            name="destinationUrl"
            type="url"
            required
            placeholder="https://..."
          />
        </label>
        <label className="label">
          Campaña
          <input className="input" name="campaignLabel" placeholder="Promo 2x1" />
        </label>
      </div>
      {error ? <p style={{ color: "var(--danger)" }}>{error}</p> : null}
      <button className="btn" type="submit" disabled={pending}>
        {pending ? "Creando..." : "Crear QR"}
      </button>
    </form>
  );
}
