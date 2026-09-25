import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "apps", "web", "public");
mkdirSync(outDir, { recursive: true });
writeFileSync(
  path.join(outDir, "_redirects"),
  "# Los destinos de QR se resuelven en /r/:slug desde el navegador.\n",
  "utf8",
);
console.log("Redirects estáticos de QR desactivados");
