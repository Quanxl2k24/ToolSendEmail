/**
 * webhooks.controller.ts
 *
 * GHI CHÚ: Gmail SMTP KHÔNG hỗ trợ webhook delivery/bounce/open tracking.
 * Nếu sau này chuyển sang ESP có webhook (SendGrid, Resend, AWS SES...),
 * hãy kích hoạt lại route này và cập nhật format payload tương ứng.
 *
 * Cấu trúc payload mẫu (cần adapt theo ESP cụ thể):
 *   POST /api/webhooks/mail-status
 *   Body: [{ messageId: "...", event: "delivered" | "bounce" | "open" }]
 */
declare const router: import("express-serve-static-core").Router;
export default router;
//# sourceMappingURL=webhooks.controller.d.ts.map