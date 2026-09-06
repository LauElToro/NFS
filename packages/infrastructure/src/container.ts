import {
  AuthenticateUser,
  CreateQrCode,
  GetCommerceKpis,
  RecordScanAndRedirect,
  RegisterUser,
  UpdateQrCode,
} from "@nfs/application";
import {
  BcryptPasswordHasher,
  QrCodeRenderer,
  SystemClock,
  UuidGenerator,
} from "./adapters.js";
import { prisma } from "./prisma.js";
import {
  PrismaQrCodeRepository,
  PrismaScanEventRepository,
  PrismaUserRepository,
} from "./repositories.js";

export function createContainer() {
  const qrs = new PrismaQrCodeRepository(prisma);
  const scans = new PrismaScanEventRepository(prisma);
  const users = new PrismaUserRepository(prisma);
  const ids = new UuidGenerator();
  const clock = new SystemClock();
  const hasher = new BcryptPasswordHasher();
  const qrRenderer = new QrCodeRenderer();

  return {
    prisma,
    qrs,
    scans,
    users,
    qrRenderer,
    registerUser: new RegisterUser(users, ids, clock, hasher),
    authenticateUser: new AuthenticateUser(users, hasher),
    createQrCode: new CreateQrCode(qrs, users, ids, clock),
    updateQrCode: new UpdateQrCode(qrs, clock),
    recordScanAndRedirect: new RecordScanAndRedirect(qrs, scans, ids, clock),
    getCommerceKpis: new GetCommerceKpis(qrs, scans),
  };
}

export type Container = ReturnType<typeof createContainer>;
