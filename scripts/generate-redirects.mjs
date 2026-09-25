import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const qrs = JSON.parse(readFileSync(path.join(root, "data", "qrs.json"), "utf8"));
const lines = [
  "# Generado desde data/qrs.json. No editar a mano.",
  ...qrs
    .filter((qr) => qr.isActive && qr.slug && qr.destinationUrl)
    .map((qr) => `/r/${qr.slug}  ${qr.destinationUrl}  302`),
  "",
];

const outDir = path.join(root, "apps", "web", "public");
mkdirSync(outDir, { recursive: true });
writeFileSync(path.join(outDir, "_redirects"), lines.join("\n"), "utf8");
console.log(`Redirects: ${lines.length - 2} QR → apps/web/public/_redirects`);
