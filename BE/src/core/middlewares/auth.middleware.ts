import type { Request, Response, NextFunction } from "express";
import { google } from "googleapis";
import { AppError } from "../exceptions/appError.js";
import { upsertUserToken } from "../../modules/auth/token.service.js";
import { verifyJwt, verifyJwtIgnoreExpiry } from "../utils/jwt.util.js";
import type { JwtPayload } from "../utils/jwt.util.js";

/**
 * GoogleUser — attached to req.user after successful authentication.
 * accessToken may be present when using legacy Google token auth.
 */
export interface GoogleUser {
  sub: string;
  email: string;
  name: string;
  picture?: string;
  /** Only present when using legacy Google access token auth (backward compat) */
  accessToken?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: GoogleUser;
    }
  }
}

/**
 * JWT-based authentication middleware.
 * Verifies the Bearer token as a JWT signed by this server.
 * Used for auth routes that don't need Google API access.
 */
export const jwtAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new AppError("Chưa xác thực. Vui lòng đăng nhập.", 401));
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return next(new AppError("Token không hợp lệ.", 401));
  }

  // Mock mode (development)
  if (token.startsWith("mock_")) {
    const email = token.split("_")[1] || "dev-user@example.com";
    req.user = {
      sub: "mock_sub_123456789",
      email,
      name: "Developer Sandbox",
      picture: "https://lh3.googleusercontent.com/a/default-user=s96-c",
      accessToken: token,
    };
    return next();
  }

  try {
    const payload: JwtPayload = verifyJwt(token);
    const user: GoogleUser = {
      sub: payload.sub,
      email: payload.email,
      name: payload.name,
    };
    if (payload.picture) user.picture = payload.picture;
    req.user = user;
    next();
  } catch {
    return next(new AppError("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.", 401));
  }
};

/**
 * JWT refresh middleware — accepts both valid and expired tokens.
 * Only rejects if the signature is invalid or the token is malformed.
 */
export const jwtRefreshMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new AppError("Chưa xác thực. Vui lòng đăng nhập.", 401));
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return next(new AppError("Token không hợp lệ.", 401));
  }

  if (token.startsWith("mock_")) {
    const email = token.split("_")[1] || "dev-user@example.com";
    req.user = {
      sub: "mock_sub_123456789",
      email,
      name: "Developer Sandbox",
      picture: "https://lh3.googleusercontent.com/a/default-user=s96-c",
      accessToken: token,
    };
    return next();
  }

  try {
    const payload = verifyJwtIgnoreExpiry(token);
    req.user = {
      sub: payload.sub,
      email: payload.email,
      name: payload.name,
    };
    if (payload.picture) req.user.picture = payload.picture;
    next();
  } catch {
    return next(new AppError("Token không hợp lệ hoặc đã bị thay đổi.", 401));
  }
};

/**
 * Legacy Google OAuth2 token verification middleware.
 * Validates the access_token directly against Google's userinfo API.
 * Kept for backward compatibility with campaign routes during migration.
 * Will be replaced by jwtAuthMiddleware in Phase 3.
 */
export const googleAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new AppError("Chưa xác thực. Vui lòng đăng nhập bằng Google.", 401));
  }

  const accessToken = authHeader.split(" ")[1];
  if (!accessToken) {
    return next(new AppError("Access token không hợp lệ.", 401));
  }

  if (accessToken.startsWith("mock_")) {
    const email = accessToken.split("_")[1] || "dev-user@example.com";
    req.user = {
      sub: "mock_sub_123456789",
      email,
      name: "Developer Sandbox",
      picture: "https://lh3.googleusercontent.com/a/default-user=s96-c",
      accessToken,
    };
    return next();
  }

  try {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const { data } = await oauth2.userinfo.get();

    if (!data.id || !data.email) {
      return next(new AppError("Không thể lấy thông tin người dùng từ Google.", 401));
    }

    const user: GoogleUser = {
      sub: data.id,
      email: data.email,
      name: data.name ?? data.email,
      accessToken,
    };
    if (data.picture) user.picture = data.picture;
    req.user = user;

    upsertUserToken(user.email, accessToken).catch((err) =>
      console.warn("Failed to upsert user token", err),
    );

    next();
  } catch {
    next(new AppError("Token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.", 401));
  }
};
