import { loadServiceEnv } from "../../../../shared/config/load-env";

loadServiceEnv(__dirname);

export const envConfig = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  databaseUrl: process.env.DATABASE_URL ?? "postgresql://localhost:5432/ticket_booking",
  rabbitMqUrl: process.env.RABBITMQ_URL ?? "amqp://localhost:5672",
  redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379",
  paymentSuccessRate: Number(process.env.PAYMENT_SUCCESS_RATE ?? 80),
};

export default envConfig;
