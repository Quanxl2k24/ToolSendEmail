import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
const getPrisma = () => {
    if (global.prisma)
        return global.prisma;
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    return new PrismaClient({
        adapter,
        log: process.env.NODE_ENV === "development"
            ? ["query", "info", "warn", "error"]
            : ["error"],
    });
};
export const prisma = getPrisma();
if (process.env.NODE_ENV !== "production") {
    global.prisma = prisma;
}
export default prisma;
//# sourceMappingURL=prisma.service.js.map