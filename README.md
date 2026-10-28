# ReviewsGO

Carteles NFC + QR. La URL impresa, `/r/<identificador>`, no cambia cuando se configura el destino.

Las cuentas, los carteles, las carpetas y las activaciones se guardan en Netlify Blobs. El administrador entra al panel. Quien compra por Mercado Libre activa su cartel en `/activar` con el código que viene en el paquete.

## Local

```bash
pnpm install
pnpm dev
```

App: http://localhost:3000

## Netlify

El sitio usa `netlify.toml`. Variable requerida: `AUTH_SECRET`.

## Tests

```bash
pnpm test
```
