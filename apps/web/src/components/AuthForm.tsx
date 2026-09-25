"use client";

import { useState, useTransition } from "react";

type ActionResult = { error?: string } | void;

export function AuthForm({
  action,
  submitLabel,
}: {
  action: (form: FormData) => Promise<ActionResult>;
  submitLabel: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <form
      className="stack"
      style={{ marginTop: "1.5rem" }}
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        start(async () => {
          const res = await action(fd);
          if (res && "error" in res && res.error) setError(res.error);
        });
      }}
    >
      <label className="label">
        Email
        <input className="input" name="email" type="email" required />
      </label>
      <label className="label">
        Contraseña
        <input className="input" name="password" type="password" required minLength={6} />
      </label>
      {error ? <p style={{ color: "var(--danger)" }}>{error}</p> : null}
      <button className="btn" type="submit" disabled={pending}>
        {pending ? "..." : submitLabel}
      </button>
    </form>
  );
}
