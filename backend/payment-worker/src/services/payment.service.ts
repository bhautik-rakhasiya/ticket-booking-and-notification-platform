import { PaymentResult } from "../types";
import envConfig from "../config/env";
import logger from "../utils/logger";

/**
 * Payment simulation service.
 *
 * Uses Math.random() to simulate payment outcomes.
 * SUCCESS_RATE is read from PAYMENT_SUCCESS_RATE env var (default: 80%).
 *
 * This is intentionally isolated so a real payment gateway
 * (Stripe, Razorpay, etc.) can replace just this service without
 * touching any other part of the worker.
 */
export const paymentService = {
  /**
   * Simulates payment processing for a booking.
   *
   * @param bookingId  - The booking ID being charged
   * @param totalAmount - The amount to charge
   * @returns PaymentResult with success flag and optional failure reason
   */
  async processPayment(bookingId: string, totalAmount: number): Promise<PaymentResult> {
    const successRate = envConfig.paymentSuccessRate;
    const roll = Math.random() * 100;

    logger.info(
      `[paymentService] Processing payment for booking=${bookingId} amount=${totalAmount} successRate=${successRate}% roll=${roll.toFixed(2)}`
    );

    // Simulate a small processing delay (50–150ms)
    await new Promise((resolve) => setTimeout(resolve, 50 + Math.random() * 100));

    const success = roll < successRate;
    if (success) {
      logger.info(`[paymentService] ✅ Payment SUCCESS for booking=${bookingId}`);
      return { success: true };
    }

    const reason = "Payment declined by simulated gateway";
    logger.warn(`[paymentService] ❌ Payment FAILED for booking=${bookingId} reason="${reason}"`);
    return { success: false, reason };
  },
};

export default paymentService;
