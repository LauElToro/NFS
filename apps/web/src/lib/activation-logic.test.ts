import assert from "node:assert/strict";
import {
  completeCode,
  destinationFromInput,
  formatCode,
  generateActivationCode,
  normalizeCode,
  registerAttempt,
  reserveCode,
  revokeCode,
  sealSecret,
  secretMatches,
  type ActivationCode,
} from "./activation-logic.ts";

function sample(status: ActivationCode["status"] = "pendiente"): ActivationCode {
  return {
    id: "ACT-1",
    posterId: "SEB-1",
    token: "token-publico",
    cartelId: "CARTEL-000001",
    lookup: "lookup",
    salt: "salt",
    codeHash: "hash",
    status,
    createdAt: "2026-01-01T00:00:00.000Z",
    batchId: "LOTE-1",
    events: [],
  };
}

const place = "ChIJabcdefghij";
assert.equal(destinationFromInput(place, "google"), `https://search.google.com/local/writereview?placeid=${place}`);
assert.equal(destinationFromInput("https://wa.me/5491112345678", "whatsapp"), "https://wa.me/5491112345678");
assert.equal(destinationFromInput("https://search.google.com/local/writereview?placeid=ChIJabcdefghij", "google").includes("placeid=ChIJabcdefghij"), true);
assert.equal(destinationFromInput("javascript:alert(1)", "otro"), "");
assert.equal(destinationFromInput("data:text/html,hola", "otro"), "");
assert.equal(destinationFromInput("file:///etc/passwd", "otro"), "");
assert.equal(destinationFromInput("http://example.com", "web"), "");
assert.equal(destinationFromInput("https://example.com/<script>", "web"), "");
assert.equal(destinationFromInput("https://user:pass@example.com", "web"), "");

const plain = generateActivationCode();
assert.equal(normalizeCode(plain).length, 16);
assert.equal(formatCode(normalizeCode(`  ${plain.toLowerCase()}  `)), plain);
const sealed = sealSecret(normalizeCode(plain));
assert.equal(secretMatches(normalizeCode(plain), sealed.salt, sealed.hash), true);
assert.equal(secretMatches("OTROCODIGODISTINTO", sealed.salt, sealed.hash), false);
assert.equal(JSON.stringify(sealed).includes(plain), false);

const now = "2026-01-02T00:00:00.000Z";
const reserved = reserveCode(sample(), "claim-a", now);
assert.equal(reserved.status, "reservado");
assert.throws(() => reserveCode(reserved, "claim-b", now), /proceso/);
const done = completeCode(reserved, "claim-a", { lookup: "e", salt: "s", hash: "h" }, now);
assert.equal(done.status, "activado");
assert.equal(done.token, "token-publico");
assert.throws(() => reserveCode(done, "claim-c", now), /utilizado/);
assert.throws(() => revokeCode(done, now), /pendiente/);
assert.equal(revokeCode(sample(), now).status, "revocado");
assert.throws(() => reserveCode(revokeCode(sample(), now), "x", now), /revocado/);

let version = 1;
let current = sample();
function cas(from: number, next: ActivationCode) {
  if (from !== version) return false;
  current = next;
  version += 1;
  return true;
}
const start = version;
const snap = current;
const claimA = reserveCode(snap, "A", now);
const claimB = reserveCode(snap, "B", now);
assert.equal(cas(start, claimA), true);
assert.equal(cas(start, claimB), false);
assert.equal(current.claim, "A");
assert.equal(completeCode(current, "A", { lookup: "e", salt: "s", hash: "h" }, now).status, "activado");

let windows = {};
for (let index = 0; index < 12; index += 1) {
  const hit = registerAttempt(windows, "ip", 1_000 + index);
  windows = hit.windows;
  assert.equal(hit.blocked, false);
}
assert.equal(registerAttempt(windows, "ip", 2_000).blocked, true);

console.log("activacion ok");
