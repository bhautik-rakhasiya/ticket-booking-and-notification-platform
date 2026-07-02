export const eventRepository = {
  async releaseSeats(eventId: string, seatCount: number) {
    // Repository implementation for releasing seats on booking failure
    return { eventId, seatCount, seatsReleased: true };
  },
};

export default eventRepository;
