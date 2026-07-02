import type {
  BookingResponseDto,
  EventDto,
} from "../../../shared/dto";

export type EventItem = EventDto;
export type BookingResponse = BookingResponseDto;

export interface User {
  id: string;
  name: string;
}

export interface NotificationItem {
  id: string;
  type: "SUCCESS" | "FAILURE";
  status: string;
  message: string | null;
  createdAt: string;
  booking: {
    id: string;
    userId: string;
    seatCount: number;
    event: {
      id: string;
      name: string;
    };
  };
}
