import { DomainError } from "../shared/DomainError.js";

export class DestinationUrl {
  private constructor(readonly value: string) {}

  static create(raw: string): DestinationUrl {
    const value = raw.trim();
    let parsed: URL;
    try {
      parsed = new URL(value);
    } catch {
      throw new DomainError("URL de destino inválida");
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new DomainError("La URL debe usar http o https");
    }
    return new DestinationUrl(parsed.toString());
  }

  static fromTrusted(value: string): DestinationUrl {
    return new DestinationUrl(value);
  }
}
