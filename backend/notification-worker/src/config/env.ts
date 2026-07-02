import { loadServiceEnv } from "../../../../shared/config/load-env";

loadServiceEnv(__dirname);

export const envConfig = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  databaseUrl: process.env.DATABASE_URL ?? "postgresql://localhost:5432/ticket_booking",
  rabbitMqUrl: process.env.RABBITMQ_URL ?? "amqp://localhost:5672",
  retryDelayMs: Number(process.env.RETRY_DELAY_MS ?? 5000),
  maxNotificationRetries: Number(process.env.MAX_NOTIFICATION_RETRIES ?? 3),
};

export default envConfig;
