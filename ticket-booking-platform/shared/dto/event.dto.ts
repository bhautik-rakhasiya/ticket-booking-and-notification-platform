export interface EventDto {
  id: string;
  name: string;
  description: string | null;
  totalSeats: number;
  availableSeats: number;
  price: number;
  status: string;
}
