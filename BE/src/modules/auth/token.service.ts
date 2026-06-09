import { randomUUID } from "crypto";
import prisma from "../../core/database/prisma.service.js";
import { encryptToken, decryptToken } from "../../core/utils/crypto.util.js";
import { exchangeCodeForTokens } from "./oauth2.client.js";
import { AppError } from "../../core/exceptions/appError.js";

export const upsertUserToken = async (
  email: string,
  accessToken: string,
  refreshToken?: string | null,
  expiresIn?: number,
) => {
  const tokenExpiry = expiresIn
    ? new Date(Date.now() + expiresIn * 1000)
    : null;

  const encryptedAccess = encryptToken(accessToken);
  const encryptedRefresh = refreshToken ? encryptToken(refreshToken) : null;

  await prisma.userToken.upsert({
    where: { email },
    update: {
      accessToken: encryptedAccess,
      ...(refreshToken !== undefined ? { refreshToken: encryptedRefresh } : {}),
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

export const exchangeAuthorizationCode = async (code: string) => {
  const { accessToken, refreshToken, expiresIn, userInfo } =
    await exchangeCodeForTokens(code);

  if (!userInfo) {
    throw new AppError("Không thể lấy thông tin người dùng từ Google.", 400);
  }

  const tokenFamily = randomUUID();
  const tokenExpiry = expiresIn
    ? new Date(Date.now() + expiresIn * 1000)
    : null;

  const encryptedAccess = encryptToken(accessToken);
  const encryptedRefresh = refreshToken ? encryptToken(refreshToken) : null;

  await prisma.userToken.upsert({
    where: { email: userInfo.email },
    update: {
      accessToken: encryptedAccess,
      refreshToken: encryptedRefresh,
      tokenExpiry,
      tokenFamily,
      lastRefreshedAt: new Date(),
    },
    create: {
      email: userInfo.email,
      accessToken: encryptedAccess,
      refreshToken: encryptedRefresh,
      tokenExpiry,
      tokenFamily,
      lastRefreshedAt: new Date(),
    },
  });

  return userInfo;
};

export const refreshAccessToken = async (email: string): Promise<string> => {
  const record = await prisma.userToken.findUnique({ where: { email } });
  if (!record?.refreshToken) {
    throw new AppError("Phiên đăng nhập Google đã hết hạn. Vui lòng đăng nhập lại.", 401);
  }

  const refreshToken = decryptToken(record.refreshToken);

  const { google } = await import("googleapis");
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  );
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  try {
    const { credentials } = await oauth2Client.refreshAccessToken();

    const updates: Record<string, unknown> = {
      accessToken: encryptToken(credentials.access_token!),
      tokenExpiry: new Date(credentials.expiry_date!),
      lastRefreshedAt: new Date(),
    };

    if (credentials.refresh_token) {
      updates.refreshToken = encryptToken(credentials.refresh_token);
      updates.tokenFamily = randomUUID();
    }

    await prisma.userToken.update({ where: { email }, data: updates });

    return credentials.access_token!;
  } catch (error: unknown) {
    if (error instanceof Error && error.message?.includes("invalid_grant")) {
      await prisma.userToken.update({
        where: { email },
        data: { refreshToken: null, tokenExpiry: null },
      });
      throw new AppError("Phiên đăng nhập Google đã hết hạn. Vui lòng đăng nhập lại.", 401);
    }
    throw error;
  }
};

export const getAccessToken = async (email: string): Promise<string> => {
  const record = await prisma.userToken.findUnique({ where: { email } });
  if (!record) {
    throw new AppError("Không tìm thấy token cho người dùng này.", 401);
  }

  const FIVE_MINUTES_MS = 5 * 60 * 1000;
  if (record.tokenExpiry && record.tokenExpiry.getTime() - FIVE_MINUTES_MS < Date.now()) {
    return refreshAccessToken(email);
  }

  return decryptToken(record.accessToken);
};
