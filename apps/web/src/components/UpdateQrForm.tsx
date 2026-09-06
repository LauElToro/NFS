"use client";

import { useState, useTransition } from "react";

type ActionResult = { error?: string } | void;

export function UpdateQrForm({
  action,
  initial,
}: {
  action: (form: FormData) => Promise<ActionResult>;
  initial: {
    id: string;
    title: string;
    destinationUrl: string;
    isActive: boolean;
    campaignLabel: string;
  };
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
        });
      }}
    >
      <input type="hidden" name="id" value={initial.id} />
      <label className="label">
        Título
        <input className="input" name="title" defaultValue={initial.title} required />
      </label>
      <label className="label">
        URL destino
        <input
          className="input"
          name="destinationUrl"
          type="url"
          defaultValue={initial.destinationUrl}
          required
        />
      </label>
      <label className="label">
        Estado
        <select className="input" name="isActive" defaultValue={String(initial.isActive)}>
          <option value="true">Activo</option>
          <option value="false">Pausado</option>
        </select>
      </label>
      <label className="label">
        Campaña
        <input className="input" name="campaignLabel" defaultValue={initial.campaignLabel} />
      </label>
      {error ? <p style={{ color: "var(--danger)" }}>{error}</p> : null}
      <button className="btn" type="submit" disabled={pending}>
        {pending ? "Guardando..." : "Guardar cambios"}
      </button>
    </form>
  );
}
