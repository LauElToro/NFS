import type { QrCode } from "./qr/QrCode.js";
import type { ScanEvent } from "./scanning/ScanEvent.js";

export interface MerchantAccount {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
}

export interface QrCodeRepository {
  findById(id: string): Promise<QrCode | null>;
  findBySlug(slug: string): Promise<QrCode | null>;
  listByOwner(ownerId: string): Promise<QrCode[]>;
  countByOwner(ownerId: string): Promise<number>;
  save(qr: QrCode): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface ScanEventRepository {
  save(event: ScanEvent): Promise<void>;
  listByOwner(ownerId: string, from?: Date): Promise<ScanEvent[]>;
  listByQr(qrCodeId: string, from?: Date): Promise<ScanEvent[]>;
  countByQr(qrCodeId: string): Promise<number>;
}

export interface UserRepository {
  findById(id: string): Promise<MerchantAccount | null>;
  findByEmail(email: string): Promise<MerchantAccount | null>;
  save(user: MerchantAccount): Promise<void>;
}

export interface QrRenderer {
  toPng(content: string): Promise<Uint8Array>;
  toSvg(content: string): Promise<string>;
}

export interface IdGenerator {
  generate(): string;
}

export interface Clock {
  now(): Date;
}
