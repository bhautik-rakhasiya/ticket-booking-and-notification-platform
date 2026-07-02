import amqp from "amqplib";
import rabbitMqConfig from "../config/rabbitmq";

let connection: amqp.Connection | null = null;
let channel: amqp.Channel | null = null;

export async function connectRabbitMQ(): Promise<{
  connection: amqp.Connection;
  channel: amqp.Channel;
}> {
  if (connection && channel) {
    return { connection, channel };
  }

  try {
    connection = await amqp.connect(rabbitMqConfig.url);
    channel = await connection.createChannel();
    return { connection, channel };
  } catch (err) {
    console.error("Failed to connect to RabbitMQ in payment-worker:", err);
    throw err;
  }
}

export default connectRabbitMQ;
