import { createLogger, format, transports } from "winston";
import envConfig from "../config/env";

const logger = createLogger({
  level: envConfig.nodeEnv === "production" ? "info" : "debug",
  format: format.combine(
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    format.errors({ stack: true }),
    format.printf(({ timestamp, level, message, ...meta }) => {
      const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
      return `[${timestamp}] [payment-worker] ${level.toUpperCase()}: ${message}${metaStr}`;
    })
  ),
  transports: [new transports.Console()],
});

export default logger;
