import morgan from "morgan";
import envConfig from "../config/env";

export const requestLogger = morgan(
  envConfig.nodeEnv === "production" ? "combined" : "dev"
);
