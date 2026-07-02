export type {
  BookingCreatedEvent,
  BookingConfirmedEvent,
  BookingFailedEvent,
} from "../../../../shared/events";

export interface PaymentResult {
  success: boolean;
  reason?: string;
}
