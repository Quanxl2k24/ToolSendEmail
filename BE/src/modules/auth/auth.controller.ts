import { Router } from "express";
import type { Request, Response } from "express";
import asyncCatch from "../../core/middlewares/asyncCatch.middleware.js";
import { googleAuthMiddleware } from "../../core/middlewares/auth.middleware.js";
import { upsertUserToken } from "./token.service.js";
import { AppError } from "../../core/exceptions/appError.js";
import { logger } from "../../core/utils/logger.js";

const router = Router();

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
  googleAuthMiddleware,
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
