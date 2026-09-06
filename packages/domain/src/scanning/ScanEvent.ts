import type { DeviceType } from "../qr/QrCode.js";

export interface ScanEventProps {
  id: string;
  qrCodeId: string;
  scannedAt: Date;
  userAgent: string;
  deviceType: DeviceType;
  browser: string | null;
  os: string | null;
  acceptLanguage: string | null;
  visitorHash: string;
  referer: string | null;
}

export class ScanEvent {
  private constructor(readonly props: ScanEventProps) {}

  static create(props: ScanEventProps): ScanEvent {
    return new ScanEvent(props);
  }

  get id() {
    return this.props.id;
  }
  get qrCodeId() {
    return this.props.qrCodeId;
  }
  get scannedAt() {
    return this.props.scannedAt;
  }
  get deviceType() {
    return this.props.deviceType;
  }
  get visitorHash() {
    return this.props.visitorHash;
  }
}
