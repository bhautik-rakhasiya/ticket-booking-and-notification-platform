import type {
  BookingConfirmedEvent,
  BookingFailedEvent,
} from "../../../../shared/events";

export type BookingStatusEvent = BookingConfirmedEvent | BookingFailedEvent;

export type {
  CreateNotificationDto as CreateNotificationInput,
} from "../../../../shared/dto";
