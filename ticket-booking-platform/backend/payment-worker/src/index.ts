import { bookingCreatedConsumer } from "./consumers/booking-created.consumer";

console.log("Payment worker started");
bookingCreatedConsumer.start();
