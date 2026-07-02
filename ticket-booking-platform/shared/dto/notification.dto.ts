export interface NotificationDto {
  id: string;
  bookingId: string;
  type: "SUCCESS" | "FAILURE";
  status: string;
  retryCount: number;
  message: string | null;
}
