import { bookingConfirmedConsumer } from "./consumers/booking-confirmed.consumer";
import { bookingFailedConsumer } from "./consumers/booking-failed.consumer";

console.log("Notification worker started");
bookingConfirmedConsumer.start();
bookingFailedConsumer.start();
