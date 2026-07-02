export const bookingRepository = {
  async updateStatus(bookingId: string, status: "CONFIRMED" | "FAILED", failureReason?: string) {
    // Repository implementation for updating booking status in database
    return { bookingId, status, failureReason };
  },
};

export default bookingRepository;
