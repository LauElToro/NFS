import {
  DomainError,
  type Clock,
  type IdGenerator,
  type MerchantAccount,
  type UserRepository,
} from "@nfs/domain";

export interface PasswordHasher {
  hash(password: string): Promise<string>;
  verify(password: string, hash: string): Promise<boolean>;
}

export class RegisterUser {
  constructor(
    private readonly users: UserRepository,
    private readonly ids: IdGenerator,
    private readonly clock: Clock,
    private readonly hasher: PasswordHasher,
  ) {}

  async execute(input: {
    email: string;
    password: string;
  }): Promise<MerchantAccount> {
    const email = input.email.trim().toLowerCase();
    if (!email.includes("@")) throw new DomainError("Email inválido");
    if (input.password.length < 6) {
      throw new DomainError("La contraseña debe tener al menos 6 caracteres");
    }
    if (await this.users.findByEmail(email)) {
      throw new DomainError("Ya existe una cuenta con ese email");
    }
    const user: MerchantAccount = {
      id: this.ids.generate(),
      email,
      passwordHash: await this.hasher.hash(input.password),
      createdAt: this.clock.now(),
    };
    await this.users.save(user);
    return user;
  }
}

export class AuthenticateUser {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
  ) {}

  async execute(input: {
    email: string;
    password: string;
  }): Promise<MerchantAccount> {
    const user = await this.users.findByEmail(input.email.trim().toLowerCase());
    if (!user) throw new DomainError("Credenciales inválidas");
    const ok = await this.hasher.verify(input.password, user.passwordHash);
    if (!ok) throw new DomainError("Credenciales inválidas");
    return user;
  }
}
