export type DeviceType = "mobile" | "tablet" | "desktop";

export interface CampaignMetrics {
  label: string | null;
}

export interface QrCodeProps {
  id: string;
  ownerId: string;
  slug: string;
  title: string;
  destinationUrl: string;
  isActive: boolean;
  campaign: CampaignMetrics;
  createdAt: Date;
  updatedAt: Date;
}

export class QrCode {
  private constructor(private props: QrCodeProps) {}

  static rehydrate(props: QrCodeProps): QrCode {
    return new QrCode(props);
  }

  get id() {
    return this.props.id;
  }
  get ownerId() {
    return this.props.ownerId;
  }
  get slug() {
    return this.props.slug;
  }
  get title() {
    return this.props.title;
  }
  get destinationUrl() {
    return this.props.destinationUrl;
  }
  get isActive() {
    return this.props.isActive;
  }
  get campaign() {
    return this.props.campaign;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }

  updateDestination(url: string, now = new Date()): void {
    this.props.destinationUrl = url;
    this.props.updatedAt = now;
  }

  updateDetails(
    input: {
      title?: string;
      isActive?: boolean;
      campaign?: Partial<CampaignMetrics>;
    },
    now = new Date(),
  ): void {
    if (input.title !== undefined) this.props.title = input.title;
    if (input.isActive !== undefined) this.props.isActive = input.isActive;
    if (input.campaign) {
      this.props.campaign = {
        label: input.campaign.label ?? this.props.campaign.label,
      };
    }
    this.props.updatedAt = now;
  }

  toProps(): QrCodeProps {
    return { ...this.props, campaign: { ...this.props.campaign } };
  }
}
