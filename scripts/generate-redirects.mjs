import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
function slugFromTitle(title) {
  return (
    String(title)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48) || "qr"
  );
}

const qrs = JSON.parse(readFileSync(path.join(root, "data", "qrs.json"), "utf8"));
const lines = [
  "# Generado desde data/qrs.json. No editar a mano.",
  ...qrs
    .filter((qr) => qr.title && qr.url)
    .map((qr) => `/r/${slugFromTitle(qr.title)}  ${qr.url}  302`),
  "",
];

const outDir = path.join(root, "apps", "web", "public");
mkdirSync(outDir, { recursive: true });
writeFileSync(path.join(outDir, "_redirects"), lines.join("\n"), "utf8");
console.log(`Redirects: ${lines.length - 2} QR → apps/web/public/_redirects`);
