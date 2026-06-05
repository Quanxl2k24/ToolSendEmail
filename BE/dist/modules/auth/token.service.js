import prisma from "../../core/database/prisma.service.js";
import { encryptToken } from "../../core/utils/crypto.util.js";
export const upsertUserToken = async (email, accessToken, refreshToken, expiresIn) => {
    const tokenExpiry = expiresIn
        ? new Date(Date.now() + expiresIn * 1000)
        : null;
    const encryptedAccess = encryptToken(accessToken);
    const encryptedRefresh = refreshToken ? encryptToken(refreshToken) : null;
    await prisma.userToken.upsert({
        where: { email },
        update: {
            accessToken: encryptedAccess,
            ...(refreshToken !== undefined
                ? { refreshToken: encryptedRefresh }
                : {}),
            ...(tokenExpiry ? { tokenExpiry } : {}),
        },
        create: {
            email,
            accessToken: encryptedAccess,
            refreshToken: encryptedRefresh,
            tokenExpiry,
        },
    });
};
//# sourceMappingURL=token.service.js.map