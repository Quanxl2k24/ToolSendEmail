import { Router } from "express";
import type { Request, Response } from "express";
import { randomUUID } from "crypto";
import asyncCatch from "../../core/middlewares/asyncCatch.middleware.js";
import { jwtAuthMiddleware, jwtRefreshMiddleware } from "../../core/middlewares/auth.middleware.js";
import type { JwtPayload } from "../../core/utils/jwt.util.js";
import { exchangeAuthorizationCode, upsertUserToken } from "./token.service.js";
import { generateAuthUrl } from "./oauth2.client.js";
import { signJwt } from "../../core/utils/jwt.util.js";
import { AppError } from "../../core/exceptions/appError.js";
import { logger } from "../../core/utils/logger.js";
import { rateLimiter } from "../../core/utils/rateLimiter.util.js";

const router = Router();

const OAUTH_STATE_COOKIE = "oauth_state";
const STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function getFrontendUrl(): string {
  return process.env.FRONTEND_URL ?? "http://localhost:5173";
}

/**
 * Generate a random state value for CSRF protection
 * and store it in a cookie.
 */
function setOAuthStateCookie(res: Response): string {
  const state = randomUUID();
  res.cookie(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: STATE_TTL_MS,
    path: "/api/auth/google/callback",
  });
  return state;
}

/**
 * @openapi
 * /api/auth/google/url:
 *   get:
 *     summary: Redirect to Google OAuth authorization page
 *     tags: [Auth]
 *     responses:
 *       302:
 *         description: Redirect to Google
 */
router.get(
  "/google/url",
  asyncCatch(async (_req: Request, res: Response) => {
    const state = setOAuthStateCookie(res);
    const url = generateAuthUrl(state);
    res.redirect(302, url);
  }),
);

/**
 * @openapi
 * /api/auth/google/callback:
 *   get:
 *     summary: Google OAuth callback — exchange code for tokens, create JWT
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *       - in: query
 *         name: error
 *         schema:
 *           type: string
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *     responses:
 *       302:
 *         description: Redirect to frontend with JWT token or error
 */
router.get(
  "/google/callback",
  asyncCatch(async (req: Request, res: Response) => {
    const frontendUrl = getFrontendUrl();

    // Handle user denying consent
    const error = req.query.error as string | undefined;
    if (error) {
      logger.warn("Google OAuth error", { error });
      return res.redirect(302, `${frontendUrl}?error=${encodeURIComponent(error)}`);
    }

    const { code, state } = req.query as {
      code?: string;
      state?: string;
    };

    if (!code) {
      throw new AppError("Missing authorization code.", 400);
    }

    // CSRF: verify state cookie matches query param
    const cookieState = req.cookies?.[OAUTH_STATE_COOKIE];
    res.clearCookie(OAUTH_STATE_COOKIE, { path: "/api/auth/google/callback" });

    if (!state || !cookieState || state !== cookieState) {
      logger.warn("OAuth state mismatch — possible CSRF", {
        cookieState,
        queryState: state,
      });
      return res.redirect(302, `${frontendUrl}?error=${encodeURIComponent("state_mismatch")}`);
    }

    const userInfo = await exchangeAuthorizationCode(code);

    const jwtPayload = {
      sub: userInfo.sub,
      email: userInfo.email,
      name: userInfo.name,
      ...(userInfo.picture ? { picture: userInfo.picture } : {}),
    } satisfies JwtPayload;

    const token = signJwt(jwtPayload);

    const redirectUrl = `${frontendUrl}?token=${encodeURIComponent(token)}`;

    logger.info("User logged in via Google OAuth", { email: userInfo.email });
    res.redirect(302, redirectUrl);
  }),
);

/**
 * @openapi
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh JWT session token (rate-limited)
 *     tags: [Auth]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: New JWT token
 */
router.post(
  "/refresh",
  rateLimiter("auth-refresh", 10, 60_000),
  jwtRefreshMiddleware,
  asyncCatch(async (req: Request, res: Response) => {
    const jwtPayload = {
      sub: req.user!.sub,
      email: req.user!.email,
      name: req.user!.name,
      ...(req.user!.picture ? { picture: req.user!.picture } : {}),
    } satisfies JwtPayload;

    const token = signJwt(jwtPayload);
    res.json({ token });
  }),
);

/**
 * @openapi
 * /api/auth/update-token:
 *   post:
 *     summary: Update or store the user's OAuth access token
 *     tags: [Auth]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               accessToken:
 *                 type: string
 *               refreshToken:
 *                 type: string
 *               expiresIn:
 *                 type: number
 *     responses:
 *       200:
 *         description: Token updated successfully
 */
router.post(
  "/update-token",
  jwtAuthMiddleware,
  asyncCatch(async (req: Request, res: Response) => {
    const { accessToken, refreshToken, expiresIn } = req.body as {
      accessToken?: string;
      refreshToken?: string;
      expiresIn?: number;
    };

    if (!accessToken) {
      throw new AppError("accessToken là bắt buộc.", 400);
    }

    await upsertUserToken(
      req.user!.email,
      accessToken,
      refreshToken,
      expiresIn,
    );

    logger.info("User token updated", { email: req.user!.email });

    res.status(200).json({ success: true });
  }),
);

export default router;
