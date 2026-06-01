import "dotenv/config";
import { PrismaClient } from "@prisma/client";
/**
 * Prisma Client Singleton
 *
 * Prisma 7 requires an adapter if engineType is client.
 */
declare global {
    var prisma: PrismaClient | undefined;
}
export declare const prisma: PrismaClient<import("@prisma/client").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/client").DefaultArgs>;
export default prisma;
//# sourceMappingURL=prisma.service.d.ts.map