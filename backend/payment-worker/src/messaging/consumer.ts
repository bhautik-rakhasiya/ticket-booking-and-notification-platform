import { connectRabbitMQ } from "./connection";

export async function consumeMessages(queue: string, onMessage: (msg: any) => Promise<void>): Promise<void> {
  try {
    const { channel } = await connectRabbitMQ();
    await channel.assertQueue(queue, { durable: true });
    
    await channel.consume(queue, async (msg) => {
      if (msg) {
        try {
          const content = JSON.parse(msg.content.toString());
          await onMessage(content);
          channel.ack(msg);
        } catch (err) {
          console.error("Failed to process consumed message in payment-worker:", err);
          // Nack message and requeue depending on retry strategy
          channel.nack(msg, false, true);
        }
      }
    });
  } catch (err) {
    console.error(`Failed to start consumer on queue ${queue}:`, err);
  }
}

export default consumeMessages;
