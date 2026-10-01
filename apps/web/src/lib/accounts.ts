import { randomBytes, randomUUID } from "node:crypto";
import { BcryptPasswordHasher } from "@nfs/infrastructure";
import seedUsers from "../../../../data/users.json";
import { readStored, writeStored } from "./blob-store";

export type Role = "admin" | "reseller";

export type Account = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  credits: number;
  active: boolean;
  createdAt: string;
};

export type PublicAccount = Omit<Account, "passwordHash">;

export type PackCode = {
  code: string;
  credits: number;
  createdAt: string;
  redeemedBy: string | null;
  redeemedAt: string | null;
};

const USERS_KEY = "users";
const PACKS_KEY = "pack-codes";
const ADMIN_EMAIL = "admin@nfs.com";
const hasher = new BcryptPasswordHasher();

function seedAccounts(): Account[] {
  return (seedUsers as { id: string; email: string; passwordHash: string; createdAt: string }[]).map(
    (user) => {
      const email = user.email.toLowerCase();
      const admin = email === ADMIN_EMAIL;
      return {
        id: user.id,
        name: admin ? "Administrador" : email.split("@")[0] || "Revendedor",
        email,
        passwordHash: user.passwordHash,
        role: admin ? "admin" : "reseller",
        credits: 0,
        active: true,
        createdAt: user.createdAt,
      };
    },
  );
}

export function toPublic(account: Account): PublicAccount {
  const { passwordHash: _hash, ...rest } = account;
  return rest;
}

export async function readAccounts(): Promise<Account[]> {
  const data = await readStored<Account[] | null>(USERS_KEY, null);
  if (data == null) {
    const seed = seedAccounts();
    await writeStored(USERS_KEY, seed);
    return seed;
  }
  return data;
}

export async function writeAccounts(accounts: Account[]): Promise<void> {
  await writeStored(USERS_KEY, accounts);
}

export async function findAccount(id: string): Promise<Account | null> {
  return (await readAccounts()).find((account) => account.id === id) ?? null;
}

export async function authenticate(email: string, password: string) {
  const account = (await readAccounts()).find((user) => user.email === email.trim().toLowerCase());
  if (!account) return null;
  const ok = await hasher.verify(password, account.passwordHash);
  if (!ok) return null;
  return account;
}

export async function createReseller(input: {
  name: string;
  email: string;
  password: string;
  credits: number;
}) {
  const accounts = await readAccounts();
  const email = input.email.trim().toLowerCase();
  if (!email.includes("@")) throw new Error("Email inválido");
  if (input.password.length < 6) throw new Error("La contraseña debe tener al menos 6 caracteres");
  if (accounts.some((account) => account.email === email)) {
    throw new Error("Ya existe una cuenta con ese email");
  }
  const credits = Math.max(0, Math.floor(input.credits));
  const account: Account = {
    id: randomUUID(),
    name: input.name.trim() || email.split("@")[0] || "Revendedor",
    email,
    passwordHash: await hasher.hash(input.password),
    role: "reseller",
    credits,
    active: true,
    createdAt: new Date().toISOString(),
  };
  await writeAccounts([...accounts, account]);
  return account;
}

export async function updateReseller(
  id: string,
  patch: { name?: string; active?: boolean; creditsDelta?: number; password?: string },
) {
  const accounts = await readAccounts();
  const current = accounts.find((account) => account.id === id);
  if (!current || current.role !== "reseller") throw new Error("Revendedor no encontrado");
  const credits =
    patch.creditsDelta === undefined
      ? current.credits
      : Math.max(0, current.credits + Math.trunc(patch.creditsDelta));
  const next: Account = {
    ...current,
    name: patch.name?.trim() || current.name,
    active: patch.active ?? current.active,
    credits,
    passwordHash: patch.password ? await hasher.hash(patch.password) : current.passwordHash,
  };
  await writeAccounts(accounts.map((account) => (account.id === id ? next : account)));
  return next;
}

export async function changeCredits(id: string, delta: number) {
  const accounts = await readAccounts();
  const current = accounts.find((account) => account.id === id);
  if (!current) throw new Error("Usuario no encontrado");
  if (current.role === "admin") return current;
  const credits = current.credits + delta;
  if (credits < 0) throw new Error("No hay créditos disponibles. Tenés que adquirir un nuevo pack.");
  const next = { ...current, credits };
  await writeAccounts(accounts.map((account) => (account.id === id ? next : account)));
  return next;
}

export async function readPacks(): Promise<PackCode[]> {
  return readStored<PackCode[]>(PACKS_KEY, []);
}

export async function createPack(credits: number) {
  const amount = Math.floor(credits);
  if (![10, 20, 30, 40, 50, 60, 70, 80, 90, 100].includes(amount)) {
    throw new Error("El pack tiene que ser de 10, 20, 30, 40, 50, 60, 70, 80, 90 o 100 créditos");
  }
  const chunk = () => randomBytes(3).toString("hex").slice(0, 4).toUpperCase();
  const code = `NFS${amount}-${chunk()}-${chunk()}`;
  const packs = await readPacks();
  const pack: PackCode = {
    code,
    credits: amount,
    createdAt: new Date().toISOString(),
    redeemedBy: null,
    redeemedAt: null,
  };
  await writeStored(PACKS_KEY, [pack, ...packs]);
  return pack;
}

export async function redeemPack(accountId: string, rawCode: string) {
  const code = rawCode.trim().toUpperCase();
  const packs = await readPacks();
  const pack = packs.find((item) => item.code === code);
  if (!pack) throw new Error("Código inválido");
  if (pack.redeemedBy) throw new Error("Ese código ya fue usado");
  const account = await changeCredits(accountId, pack.credits);
  const used = packs.map((item) =>
    item.code === code ? { ...item, redeemedBy: accountId, redeemedAt: new Date().toISOString() } : item,
  );
  await writeStored(PACKS_KEY, used);
  return { account, pack };
}
