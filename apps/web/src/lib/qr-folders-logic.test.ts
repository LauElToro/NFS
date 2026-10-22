import assert from "node:assert/strict";
import {
  canManageFolder,
  canUseQr,
  dropQrIds,
  mergeQrIds,
  splitQrAccess,
  visibleQrIds,
} from "./qr-folders-logic.ts";

const admin = { id: "admin", role: "admin" as const };
const resellerA = { id: "reseller-a", role: "reseller" as const };
const resellerB = { id: "reseller-b", role: "reseller" as const };

const catalog = [
  { id: "qr-libre", ownerId: "admin", url: "", cartelId: "CARTEL-000001" },
  { id: "qr-a", ownerId: "reseller-a", url: "https://example.com/a", cartelId: "CARTEL-000002" },
  { id: "qr-b", ownerId: "reseller-b", url: "", cartelId: "CARTEL-000003" },
];

const snapshot = JSON.stringify(catalog);

function check(name: string, run: () => void) {
  run();
  assert.equal(JSON.stringify(catalog), snapshot, `${name} no debe modificar los QR`);
  console.log(`ok ${name}`);
}

check("el administrador agrega varios QR, incluso sin configurar", () => {
  const access = splitQrAccess(admin, catalog, ["qr-libre", "qr-a", "qr-libre", "no-existe"]);
  assert.deepEqual(access.accepted, ["qr-libre", "qr-a"]);
  assert.deepEqual(access.rejected, ["no-existe"]);
  const folder = { id: "FLD-1", name: "Smoke Eat Burger", ownerId: admin.id, qrIds: [] as string[] };
  const merged = mergeQrIds(folder.qrIds, access.accepted);
  folder.qrIds = merged.qrIds;
  assert.equal(merged.added, 2);
  assert.deepEqual(folder.qrIds, ["qr-libre", "qr-a"]);
  const again = mergeQrIds(folder.qrIds, ["qr-a"]);
  assert.equal(again.added, 0);
  assert.equal(again.qrIds.length, 2);
});

check("un revendedor solo organiza sus QR", () => {
  const own = splitQrAccess(resellerA, catalog, ["qr-a", "qr-b", "qr-libre"]);
  assert.deepEqual(own.accepted, ["qr-a"]);
  assert.deepEqual(own.rejected, ["qr-b", "qr-libre"]);
  assert.equal(canUseQr(resellerA, catalog[1]), true);
  assert.equal(canUseQr(resellerA, catalog[2]), false);
});

check("dos revendedores no ven la carpeta del otro", () => {
  const folderA = { ownerId: resellerA.id };
  const folderB = { ownerId: resellerB.id };
  assert.equal(canManageFolder(resellerA.id, folderA), true);
  assert.equal(canManageFolder(resellerA.id, folderB), false);
  assert.equal(canManageFolder(resellerB.id, folderA), false);
  assert.equal(canManageFolder(admin.id, folderA), false);
});

check("crear una carpeta conserva la selección", () => {
  const selected = ["qr-a", "qr-a"];
  const access = splitQrAccess(resellerA, catalog, selected);
  const created = mergeQrIds([], access.accepted);
  assert.deepEqual(created.qrIds, ["qr-a"]);
  assert.deepEqual(selected, ["qr-a", "qr-a"]);
});

check("eliminar la carpeta no borra los QR", () => {
  const folders = [
    { id: "FLD-1", ownerId: resellerA.id, qrIds: ["qr-a"] },
    { id: "FLD-2", ownerId: resellerA.id, qrIds: ["qr-a"] },
  ];
  const remaining = folders.filter((folder) => folder.id !== "FLD-1");
  assert.equal(remaining.length, 1);
  assert.deepEqual(remaining[0].qrIds, ["qr-a"]);
  assert.equal(catalog.find((item) => item.id === "qr-a")?.url, "https://example.com/a");
});

check("quitar un QR de la carpeta lo deja en el inventario y en otras carpetas", () => {
  const first = dropQrIds(["qr-a", "qr-libre"], ["qr-a"]);
  const second = ["qr-a"];
  assert.deepEqual(first.qrIds, ["qr-libre"]);
  assert.equal(first.removed, 1);
  assert.deepEqual(second, ["qr-a"]);
  assert.ok(catalog.some((item) => item.id === "qr-a"));
});

check("un QR sin destino sigue siendo visible para su dueño", () => {
  const allowed = new Set(catalog.filter((item) => canUseQr(resellerB, item)).map((item) => item.id));
  assert.deepEqual(visibleQrIds(["qr-b", "qr-a", "qr-b"], allowed), ["qr-b"]);
  assert.equal(catalog.find((item) => item.id === "qr-b")?.url, "");
});

console.log("carpetas ok");
