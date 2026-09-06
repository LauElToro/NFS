import { describe, expect, it } from "vitest";
import { DomainError } from "../shared/DomainError.js";
import { DestinationUrl } from "../qr/DestinationUrl.js";
import { Slug } from "../qr/Slug.js";
import { classifyDevice } from "../scanning/AudienceClassifier.js";

describe("Slug", () => {
  it("normaliza y valida", () => {
    expect(Slug.create("Promo-Menu").value).toBe("promo-menu");
  });

  it("rechaza inválidos", () => {
    expect(() => Slug.create("ab")).toThrow(DomainError);
    expect(() => Slug.create("Bad Slug!")).toThrow(DomainError);
  });
});

describe("DestinationUrl", () => {
  it("acepta https", () => {
    expect(DestinationUrl.create("https://ejemplo.com/menu").value).toContain(
      "https://ejemplo.com/menu",
    );
  });

  it("rechaza protocol raro", () => {
    expect(() => DestinationUrl.create("ftp://x.com")).toThrow(DomainError);
  });
});

describe("AudienceClassifier", () => {
  it("detecta mobile", () => {
    expect(
      classifyDevice(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
      ),
    ).toBe("mobile");
  });

  it("detecta desktop", () => {
    expect(
      classifyDevice(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
      ),
    ).toBe("desktop");
  });
});
