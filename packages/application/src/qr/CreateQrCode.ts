import {
  DestinationUrl,
  DomainError,
  QrCode,
  Slug,
  type Clock,
  type IdGenerator,
  type QrCodeRepository,
  type UserRepository,
} from "@nfs/domain";

export interface CreateQrCodeInput {
  ownerId: string;
  title: string;
  destinationUrl: string;
  slug?: string;
  campaignLabel?: string | null;
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

export class CreateQrCode {
  constructor(
    private readonly qrs: QrCodeRepository,
    private readonly users: UserRepository,
    private readonly ids: IdGenerator,
    private readonly clock: Clock,
  ) {}

  async execute(input: CreateQrCodeInput): Promise<QrCode> {
    const user = await this.users.findById(input.ownerId);
    if (!user) throw new DomainError("Usuario no encontrado");

    const base = input.slug?.trim() || slugify(input.title) || "qr";
    let slug = base;
    let attempt = 0;
    while (await this.qrs.findBySlug(slug)) {
      attempt += 1;
      slug = `${base}-${attempt}`;
    }

    const now = this.clock.now();
    const destination = DestinationUrl.create(input.destinationUrl);
    const qr = QrCode.rehydrate({
      id: this.ids.generate(),
      ownerId: input.ownerId,
      slug: Slug.create(slug).value,
      title: input.title.trim() || "Sin título",
      destinationUrl: destination.value,
      isActive: true,
      campaign: {
        label: input.campaignLabel ?? null,
      },
      createdAt: now,
      updatedAt: now,
    });

    await this.qrs.save(qr);
    return qr;
  }
}
