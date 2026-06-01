/**
 * webhooks.controller.ts
 *
 * Receives callback events from ESP (SendGrid, Resend, etc.) and updates
 * the MailLog status accordingly.
 *
 * Configure your ESP to POST events to: POST /api/webhooks/mail-status
 *
 * The webhook payload format below is generic. Adapt to match your ESP's format.
 */
declare const router: import("express-serve-static-core").Router;
export default router;
//# sourceMappingURL=webhooks.controller.d.ts.map