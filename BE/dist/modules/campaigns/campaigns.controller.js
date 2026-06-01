import { Router } from "express";
import multer from "multer";
import asyncCatch from "../../core/middlewares/asyncCatch.middleware.js";
import { googleAuthMiddleware } from "../../core/middlewares/auth.middleware.js";
import { sendCampaign, cancelCampaign, getCampaigns, getCampaign, } from "./campaigns.service.js";
import { getMailLogsByCampaign } from "./campaigns.repository.js";
import { AppError } from "../../core/exceptions/appError.js";
const router = Router();
// Multer: in-memory storage for uploaded files (max 10MB)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
});
// All campaign routes require Google Auth
router.use(googleAuthMiddleware);
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
router.get("/", asyncCatch(async (req, res) => {
    const campaigns = await getCampaigns(req.user.email);
    res.status(200).json({ success: true, data: campaigns });
}));
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
router.post("/send", upload.single("file"), asyncCatch(async (req, res) => {
    const options = {
        body: req.body,
        userEmail: req.user.email,
        accessToken: req.user.accessToken,
    };
    if (req.file)
        options.file = req.file;
    const result = await sendCampaign(options);
    res.status(200).json({ success: true, ...result });
}));
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
router.post("/:id/cancel", asyncCatch(async (req, res) => {
    const id = String(req.params["id"]);
    const result = await cancelCampaign(id, req.user.email);
    res.status(200).json({ success: true, ...result });
}));
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
router.get("/:id", asyncCatch(async (req, res) => {
    const campaignId = String(req.params["id"]);
    if (!campaignId)
        throw new AppError("Campaign ID is required", 400);
    const campaign = await getCampaign(campaignId, req.user.email);
    res.status(200).json({ success: true, data: campaign });
}));
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
router.get("/:id/logs", asyncCatch(async (req, res) => {
    const campaignId = String(req.params["id"]);
    if (!campaignId)
        throw new AppError("Campaign ID is required", 400);
    const logs = await getMailLogsByCampaign(campaignId);
    res.status(200).json({ success: true, total: logs.length, data: logs });
}));
export default router;
//# sourceMappingURL=campaigns.controller.js.map