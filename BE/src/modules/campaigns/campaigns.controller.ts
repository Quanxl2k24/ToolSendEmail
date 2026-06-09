import { Router } from "express";
import type { Request, Response } from "express";
import multer from "multer";
import asyncCatch from "../../core/middlewares/asyncCatch.middleware.js";
import { jwtAuthMiddleware } from "../../core/middlewares/auth.middleware.js";
import {
  sendCampaign,
  cancelCampaign,
  getCampaigns,
  getCampaign,
  previewSheet,
  previewFile,
  syncCampaignToSheet,
} from "./campaigns.service.js";
import { getMailLogsByCampaign } from "./campaigns.repository.js";
import { getQuota } from "./quota.service.js";
import { AppError } from "../../core/exceptions/appError.js";

const router = Router();

// Multer: in-memory storage for uploaded files (max 10MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// All campaign routes require JWT authentication
router.use(jwtAuthMiddleware);

/**
 * @openapi
 * /api/campaigns:
 *   get:
 *     summary: List all campaigns for the authenticated user
 *     tags: [Campaigns]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of campaigns
 */
router.get(
  "/",
  asyncCatch(async (req: Request, res: Response) => {
    const campaigns = await getCampaigns(req.user!.email);
    res.status(200).json({ success: true, data: campaigns });
  }),
);

/**
 * @openapi
 * /api/campaigns/send:
 *   post:
 *     summary: Create and start a new email campaign
 *     tags: [Campaigns]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [name, subject, htmlBody]
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Chiến dịch khuyến mãi tháng 5"
 *               subject:
 *                 type: string
 *                 example: "Ưu đãi đặc biệt dành riêng cho bạn!"
 *               htmlBody:
 *                 type: string
 *                 example: "<h1>Xin chào {{name}}</h1>"
 *               googleSheetUrl:
 *                 type: string
 *                 example: "https://docs.google.com/spreadsheets/d/..."
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Campaign created and emails queued
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 campaignId:
 *                   type: string
 *                 totalQueued:
 *                   type: integer
 *                 invalidSkipped:
 *                   type: integer
 */
router.post(
  "/send",
  upload.single("file"),
  asyncCatch(async (req: Request, res: Response) => {
    const options: Parameters<typeof sendCampaign>[0] = {
      body: req.body as Record<string, any>,
      userEmail: req.user!.email,
    };
    if (req.file) options.file = req.file;

    const result = await sendCampaign(options);

    res.status(200).json({ success: true, ...result });
  }),
);

/**
 * @openapi
 * /api/campaigns/preview-sheet:
 *   post:
 *     summary: Preview Google Sheet data (first 10 rows)
 *     tags: [Campaigns]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [googleSheetUrl]
 *             properties:
 *               googleSheetUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Preview data
 */
/**
 * @openapi
 * /api/campaigns/preview-file:
 *   post:
 *     summary: Preview uploaded file data (first 10 rows)
 *     tags: [Campaigns]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Preview data
 */
router.post(
  "/preview-file",
  upload.single("file"),
  asyncCatch(async (req: Request, res: Response) => {
    if (!req.file) throw new AppError("Vui lòng upload file.", 400);
    const result = await previewFile(req.file);
    res.status(200).json({ success: true, ...result });
  }),
);

router.post(
  "/preview-sheet",
  asyncCatch(async (req: Request, res: Response) => {
    const { googleSheetUrl } = req.body as { googleSheetUrl?: string };
    if (!googleSheetUrl) throw new AppError("googleSheetUrl là bắt buộc.", 400);
    const result = await previewSheet(googleSheetUrl, req.user!.email);
    res.status(200).json({ success: true, ...result });
  }),
);

/**
 * @openapi
 * /api/campaigns/quota:
 *   get:
 *     summary: Get current daily email quota usage
 *     tags: [Campaigns]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Quota info
 */
router.get(
  "/quota",
  asyncCatch(async (_req: Request, res: Response) => {
    const quota = await getQuota();
    res.status(200).json({ success: true, data: quota });
  }),
);

/**
 * @openapi
 * /api/campaigns/{id}/cancel:
 *   post:
 *     summary: Cancel an active campaign
 *     tags: [Campaigns]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Campaign cancelled
 */
router.post(
  "/:id/cancel",
  asyncCatch(async (req: Request, res: Response) => {
    const id = String(req.params["id"]);
    const result = await cancelCampaign(id, req.user!.email);
    res.status(200).json({ success: true, ...result });
  }),
);

/**
 * @openapi
 * /api/campaigns/{id}/sync-sheet:
 *   post:
 *     summary: Sync all mail log statuses to the Google Sheet
 *     tags: [Campaigns]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sheet synced successfully
 */
router.post(
  "/:id/sync-sheet",
  asyncCatch(async (req: Request, res: Response) => {
    const campaignId = String(req.params["id"]);
    const result = await syncCampaignToSheet(campaignId, req.user!.email);
    res.status(200).json({ success: true, ...result });
  }),
);

/**
 * @openapi
 * /api/campaigns/{id}:
 *   get:
 *     summary: Get a single campaign by ID
 *     tags: [Campaigns]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Campaign details
 */
router.get(
  "/:id",
  asyncCatch(async (req: Request, res: Response) => {
    const campaignId = String(req.params["id"]);
    if (!campaignId) throw new AppError("Campaign ID is required", 400);
    const campaign = await getCampaign(campaignId, req.user!.email);
    res.status(200).json({ success: true, data: campaign });
  }),
);

/**
 * @openapi
 * /api/campaigns/{id}/logs:
 *   get:
 *     summary: Get all mail logs for a campaign
 *     tags: [Campaigns]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of mail log entries
 */
router.get(
  "/:id/logs",
  asyncCatch(async (req: Request, res: Response) => {
    const campaignId = String(req.params["id"]);
    if (!campaignId) throw new AppError("Campaign ID is required", 400);
    const logs = await getMailLogsByCampaign(campaignId);
    res.status(200).json({ success: true, total: logs.length, data: logs });
  }),
);

export default router;
