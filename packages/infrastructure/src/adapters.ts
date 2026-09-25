import { createHash, randomUUID } from "node:crypto";
import type { PasswordHasher } from "@nfs/application";
import type { Clock, IdGenerator, QrRenderer } from "@nfs/domain";
import bcrypt from "bcryptjs";
import QRCode from "qrcode";

export class UuidGenerator implements IdGenerator {
  generate() {
    return randomUUID();
  }
}

export class SystemClock implements Clock {
  now() {
    return new Date();
  }
}

export class BcryptPasswordHasher implements PasswordHasher {
  hash(password: string) {
    return bcrypt.hash(password, 10);
  }
  verify(password: string, hash: string) {
    return bcrypt.compare(password, hash);
  }
}

export class QrCodeRenderer implements QrRenderer {
  async toPng(content: string) {
    const buf = await QRCode.toBuffer(content, {
      type: "png",
      width: 512,
      margin: 2,
    });
    return new Uint8Array(buf);
  }
  toSvg(content: string) {
    return QRCode.toString(content, { type: "svg", width: 512, margin: 2 });
  }
}

export function hashVisitor(ip: string, ua: string, day: string) {
  return createHash("sha256").update(`${ip}|${ua}|${day}`).digest("hex").slice(0, 32);
}
