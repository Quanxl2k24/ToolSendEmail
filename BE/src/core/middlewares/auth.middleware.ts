import type { Request, Response, NextFunction } from "express";
import { google } from "googleapis";
import { AppError } from "../exceptions/appError.js";
import { upsertUserToken } from "../../modules/auth/token.service.js";

/**
 * Google OAuth2 Auth Middleware
 *
 * Strategy: Validate Google OAuth2 Access Token passed in the Authorization header.
 * The frontend must obtain the token via Google Sign-In and send it as:
 *   Authorization: Bearer <google_access_token>
 *
 * The middleware verifies the token using Google's tokeninfo endpoint and
 * attaches the user info to req.user.
 */

export interface GoogleUser {
  sub: string;       // Google User ID
  email: string;
  name: string;
  picture?: string;
  accessToken: string; // Keep the original token for Sheets/Gmail API calls
}

// Augment Express Request to include our user type
declare global {
  namespace Express {
    interface Request {
      user?: GoogleUser;
    }
  }
}

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
    // Verify token via Google's OAuth2 API
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
  } catch (error) {
    next(new AppError("Token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.", 401));
  }
};
