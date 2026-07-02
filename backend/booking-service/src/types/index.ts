export type {
  CreateBookingDto as CreateBookingInput,
  BookingResponseDto as BookingResponse,
  EventDto as EventResponse,
} from "../../../../shared/dto";

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
