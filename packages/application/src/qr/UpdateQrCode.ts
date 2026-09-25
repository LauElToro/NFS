import {
  DestinationUrl,
  DomainError,
  type Clock,
  type QrCode,
  type QrCodeRepository,
} from "@nfs/domain";

export class UpdateQrCode {
  constructor(
    private readonly qrs: QrCodeRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: {
    id: string;
    ownerId: string;
    title?: string;
    destinationUrl?: string;
    isActive?: boolean;
    campaignLabel?: string | null;
  }): Promise<QrCode> {
    const qr = await this.qrs.findById(input.id);
    if (!qr || qr.ownerId !== input.ownerId) {
      throw new DomainError("QR no encontrado");
    }

    const now = this.clock.now();
    if (input.destinationUrl !== undefined) {
      qr.updateDestination(
        DestinationUrl.create(input.destinationUrl).value,
        now,
      );
    }
    qr.updateDetails(
      {
        title: input.title,
        isActive: input.isActive,
        campaign: {
          label: input.campaignLabel,
        },
      },
      now,
    );
    await this.qrs.save(qr);
    return qr;
  }
}
