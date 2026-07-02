import { config as loadDotEnv } from "dotenv";
import path from "path";

export function loadServiceEnv(serviceDirname: string): void {
  const rootEnvPath = path.resolve(serviceDirname, "../../../../.env");
  const serviceEnvPath = path.resolve(serviceDirname, "../../.env");

  loadDotEnv({ path: rootEnvPath });
  loadDotEnv({ path: serviceEnvPath, override: true });
}
