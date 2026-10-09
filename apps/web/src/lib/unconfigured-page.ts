function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function unconfiguredPosterHtml(code: string, posterId: string) {
  const safeCode = escapeHtml(code);
  const configureHref = escapeHtml(`/app/configurar/${encodeURIComponent(posterId)}`);
  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Cartel sin configurar — ReviewsGO</title>
  <style>
    :root { color-scheme: light; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 1.25rem;
      background: #f6f8fb;
      color: #1c2430;
      font-family: "DM Sans", system-ui, sans-serif;
    }
    main {
      width: min(440px, 100%);
      background: #fff;
      border: 1px solid rgba(66, 133, 244, 0.16);
      border-radius: 16px;
      padding: 1.25rem;
      box-shadow: 0 8px 24px rgba(28, 36, 48, 0.06);
    }
    img { width: 72px; height: 72px; display: block; margin: 0 auto 0.75rem; }
    h1 { margin: 0 0 0.35rem; font-size: 1.55rem; text-align: center; }
    .lead { margin: 0 0 1rem; text-align: center; color: #5d6b7c; }
    .row { display: grid; gap: 0.2rem; margin: 0 0 0.85rem; }
    .label { color: #5d6b7c; font-size: 0.86rem; }
    .code { font-size: 1.65rem; letter-spacing: 0.02em; }
    .status {
      display: inline-block;
      padding: 0.2rem 0.55rem;
      border-radius: 999px;
      background: rgba(251, 188, 5, 0.28);
      color: #7a4e00;
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
    .primary { border: 0; background: #1a73e8; color: #fff; }
    .secondary { border: 1px solid rgba(26, 115, 232, 0.35); background: #fff; color: #1a73e8; }
  </style>
</head>
<body>
  <main>
    <img src="/reviewsgo-logo.png" alt="ReviewsGO">
    <h1>ReviewsGO</h1>
    <p class="lead">Este cartel todavía no tiene un destino. El código no cambia al configurarlo.</p>
    <div class="row">
      <span class="label">Código del QR</span>
      <strong class="code" id="code">${safeCode}</strong>
    </div>
    <div class="row">
      <span class="label">Estado</span>
      <span class="status">Sin configurar</span>
    </div>
    <div class="actions">
      <a class="primary" href="${configureHref}">Configurar este cartel</a>
      <button class="secondary" type="button" id="copy">Copiar código</button>
      <a class="secondary" href="/app">Volver al panel</a>
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
