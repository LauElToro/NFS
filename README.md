# NFS QR

QRs en `data/qrs.json`. El dominio de Netlify redirige `/r/<slug>` al destino de cada QR.

## Destinos

Editá `data/qrs.json` (`title` y `url`) y volvé a desplegar. El build genera `apps/web/public/_redirects`: `/r/<titulo-en-slug>` responde 302 hacia esa URL.

Demo: `luca-qrs@nfs.com` / `Luca123!`

## Local

```bash
pnpm install
pnpm dev
```

App: http://localhost:3000  
Redirect de prueba: http://localhost:3000/r/menu-terraza

## Netlify

El sitio usa `netlify.toml` (plugin de Next.js). Conectá el repo y publicá. El dominio queda como base de los QR: `https://<tu-dominio>/r/<slug>`.

Variable recomendada: `AUTH_SECRET`.

## Tests

```bash
pnpm test
```
