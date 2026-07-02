import { connectRabbitMQ } from "./connection";
import { EXCHANGES } from "../../../../shared/messaging/exchanges";

export async function publishMessage(routingKey: string, message: any): Promise<boolean> {
  try {
    const { channel } = await connectRabbitMQ();
    await channel.assertExchange(EXCHANGES.BOOKING, "topic", { durable: true });
    
    const buffer = Buffer.from(JSON.stringify(message));
    return channel.publish(EXCHANGES.BOOKING, routingKey, buffer, {
      persistent: true,
    });
  } catch (err) {
    console.error(`Error publishing message with key ${routingKey} in payment-worker:`, err);
    return false;
  }
}

export default publishMessage;
