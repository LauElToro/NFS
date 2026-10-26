function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function unconfiguredPosterHtml(code: string, posterId: string, kind: "panel" | "compra" | "cerrado" | "listo" = "panel") {
  const safeCode = escapeHtml(code);
  const configureHref = escapeHtml(`/app/configurar/${encodeURIComponent(posterId)}`);
  const lead =
    kind === "compra"
      ? "Este cartel todavía no está activado. Ingresá el código que vino en el paquete para elegir a dónde van tus clientes."
      : kind === "cerrado"
        ? "Este código de activación ya no está disponible."
        : kind === "listo"
          ? "Este cartel ya fue activado. Si guardaste el enlace de administración, usalo para cambiar el destino."
          : "Este cartel todavía no tiene un destino. El código no cambia al configurarlo.";
  const primary =
    kind === "compra"
      ? `<a class="primary" href="/activar">Activar mi cartel</a>`
      : kind === "panel"
        ? `<a class="primary" href="${configureHref}">Configurar este cartel</a>`
        : "";
  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Cartel sin configurar — ReviewsGO</title>
  <style>
    :root { color-scheme: dark; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 1.25rem;
      background: #09090b;
      color: #ffffff;
      font-family: "DM Sans", system-ui, sans-serif;
    }
    main {
      width: min(440px, 100%);
      background: #141419;
      border: 1px solid #27272a;
      border-radius: 16px;
      padding: 1.25rem;
      box-shadow: 0 8px 24px rgba(28, 36, 48, 0.06);
    }
    img { width: auto; height: 40px; display: block; margin: 0 auto 0.75rem; }
    h1 { margin: 0 0 0.35rem; font-size: 1.55rem; text-align: center; }
    .lead { margin: 0 0 1rem; text-align: center; color: #a1a1aa; }
    .row { display: grid; gap: 0.2rem; margin: 0 0 0.85rem; }
    .label { color: #a1a1aa; font-size: 0.86rem; }
    .code { font-size: 1.65rem; letter-spacing: 0.02em; }
    .status {
      display: inline-block;
      padding: 0.2rem 0.55rem;
      border-radius: 999px;
      background: rgba(245, 158, 11, 0.16);
      color: #fcd34d;
      font-weight: 700;
    }
    .actions { display: grid; gap: 0.55rem; margin-top: 1rem; }
    a, button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 48px;
      border-radius: 12px;
      padding: 0.75rem 1rem;
      font: inherit;
      font-weight: 700;
      text-decoration: none;
      cursor: pointer;
    }
    .primary { border: 0; background: #7c3aed; color: #fff; }
    .secondary { border: 1px solid #27272a; background: transparent; color: #fff; }
  </style>
</head>
<body>
  <main>
    <img src="/reviewsgo-wordmark.jpg" alt="ReviewsGO">
    <h1>ReviewsGO</h1>
    <p class="lead">${lead}</p>
    <div class="row">
      <span class="label">Código del QR</span>
      <strong class="code" id="code">${safeCode}</strong>
    </div>
    <div class="row">
      <span class="label">Estado</span>
      <span class="status">Sin configurar</span>
    </div>
    <div class="actions">
      ${primary}
      <button class="secondary" type="button" id="copy">Copiar código</button>
      ${kind === "panel" ? `<a class="secondary" href="/app">Volver al panel</a>` : ""}
    </div>
  </main>
  <script>
    document.getElementById("copy").addEventListener("click", async function () {
      var code = document.getElementById("code").textContent || "";
      try {
        await navigator.clipboard.writeText(code);
        this.textContent = "Código copiado";
      } catch (e) {
        this.textContent = "No se pudo copiar";
      }
    });
  </script>
</body>
</html>`;
}
