export { DomainError } from "./shared/DomainError.js";
export { Slug } from "./qr/Slug.js";
export { DestinationUrl } from "./qr/DestinationUrl.js";
export { QrCode } from "./qr/QrCode.js";
export type { DeviceType, CampaignMetrics, QrCodeProps } from "./qr/QrCode.js";
export { ScanEvent } from "./scanning/ScanEvent.js";
export type { ScanEventProps } from "./scanning/ScanEvent.js";
export {
  classifyDevice,
  parseBrowser,
  parseOs,
} from "./scanning/AudienceClassifier.js";
export type {
  MerchantAccount,
  QrCodeRepository,
  ScanEventRepository,
  UserRepository,
  QrRenderer,
  IdGenerator,
  Clock,
} from "./ports.js";
