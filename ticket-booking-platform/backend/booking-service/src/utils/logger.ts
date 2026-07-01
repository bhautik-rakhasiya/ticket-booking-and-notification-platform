import winston from "winston";
import path from "path";

// ─── Log Formatting ──────────────────────────────────────────────────
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }), // capture stack traces if present
  winston.format.splat(),
  winston.format.json()
);

// Custom format for clean console printing
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, stack, ...metadata }) => {
    const metaString = Object.keys(metadata).length ? JSON.stringify(metadata) : "";
    return `[${timestamp}] ${level}: ${message} ${stack || metaString}`;
  })
);

// ─── Logger Transports ───────────────────────────────────────────────
const transports: winston.transport[] = [
  // Console Transport
  new winston.transports.Console({
    format: consoleFormat,
  }),
  // File Transport (saves log events inside the project workspace directory)
  new winston.transports.File({
    filename: path.join(process.cwd(), "logs", "app.log"),
    level: "info",
    maxsize: 5242880, // 5MB limit
    maxFiles: 5,
    tailable: true,
  }),
];

// ─── Logger Instance ─────────────────────────────────────────────────
export const logger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  format: logFormat,
  defaultMeta: { service: "booking-service" },
  transports,
});

export default logger;
