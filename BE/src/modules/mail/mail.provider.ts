import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { logger } from "../../core/utils/logger.js";

/**
 * mail.provider.ts
 *
 * Initializes the Nodemailer transporter using SMTP credentials from .env.
 * In Phase 2, this file can be replaced with a Resend/SendGrid SDK provider
 * without touching any other business logic.
 *
 * Required ENV vars:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
 */

let transporter: Transporter | null = null;

export const getMailTransporter = (): Transporter => {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT ?? 587) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  // Verify connection on startup
  transporter.verify((error: Error | null) => {
    if (error) {
      logger.error("SMTP connection failed", { error: String(error) });
    } else {
      logger.info("SMTP server is ready to send emails.");
    }
  });

  return transporter;
};
