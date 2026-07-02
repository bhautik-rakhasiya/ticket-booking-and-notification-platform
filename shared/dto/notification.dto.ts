export interface NotificationDto {
  id: string;
  bookingId: string;
  type: "SUCCESS" | "FAILURE";
  status: "PENDING" | "SENT" | "FAILED" | "DLQ";
  retryCount: number;
  message: string | null;
}

export interface CreateNotificationDto {
  bookingId: string;
  type: "SUCCESS" | "FAILURE";
  message: string;
}
