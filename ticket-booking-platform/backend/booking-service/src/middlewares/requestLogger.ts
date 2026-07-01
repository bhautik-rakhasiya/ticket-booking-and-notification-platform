import morgan from "morgan";

/**
 * HTTP request logger middleware using Morgan.
 *
 * Uses 'dev' format in development (colorized, concise),
 * 'combined' format in production (Apache-style, useful for log aggregators).
 */
export const requestLogger = morgan(
  process.env.NODE_ENV === "production" ? "combined" : "dev"
);
