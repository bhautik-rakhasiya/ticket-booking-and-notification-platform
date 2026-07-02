import { PrismaClient } from "@prisma/client";
import envConfig from "./env";
import { createPrismaClient } from "../../../../shared/config/create-prisma-client";

const prisma = createPrismaClient(
  PrismaClient,
  envConfig.nodeEnv,
  "__paymentWorkerPrisma__"
);

export default prisma;
