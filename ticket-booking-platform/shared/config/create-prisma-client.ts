type PrismaClientConstructor<TClient> = new (options?: {
  log?: Array<"query" | "info" | "warn" | "error">;
}) => TClient;

type PrismaGlobalStore<TClient> = {
  prisma?: TClient;
};

export function createPrismaClient<TClient>(
  PrismaClient: PrismaClientConstructor<TClient>,
  nodeEnv: string,
  globalKey: string,
  developmentLogs: Array<"query" | "info" | "warn" | "error"> = ["error", "warn"]
): TClient {
  const globalStore = globalThis as typeof globalThis & Record<string, PrismaGlobalStore<TClient> | undefined>;
  const existingStore = globalStore[globalKey];

  const prisma =
    existingStore?.prisma ??
    new PrismaClient({
      log: nodeEnv === "development" ? developmentLogs : ["error"],
    });

  if (nodeEnv !== "production") {
    globalStore[globalKey] = { prisma };
  }

  return prisma;
}
