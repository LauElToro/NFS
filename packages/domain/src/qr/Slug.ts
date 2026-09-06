import { DomainError } from "../shared/DomainError.js";

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export class Slug {
  private constructor(readonly value: string) {}

  static create(raw: string): Slug {
    const value = raw.trim().toLowerCase();
    if (value.length < 3 || value.length > 64) {
      throw new DomainError("El slug debe tener entre 3 y 64 caracteres");
    }
    if (!SLUG_RE.test(value)) {
      throw new DomainError("Slug inválido");
    }
    return new Slug(value);
  }

  static fromTrusted(value: string): Slug {
    return new Slug(value);
  }
}
