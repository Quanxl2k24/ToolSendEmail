import { getMailTransporter, getSenderAddress, getTestMessageUrl } from "./mail.provider.js";
import { logger } from "../../core/utils/logger.js";

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  recipientName?: string;
}

export interface SendEmailResult {
  messageId: string;
}

export const sendEmail = async (
  options: SendEmailOptions,
): Promise<SendEmailResult> => {
  const { to, subject, html, recipientName } = options;
  const fromAddress = getSenderAddress();

  const transporter = await getMailTransporter();

  try {
    const info = await transporter.sendMail({
      from: recipientName ? `${recipientName} <${fromAddress}>` : fromAddress,
      to,
      subject,
      html,
    });

    const previewUrl = getTestMessageUrl(info);
    if (previewUrl) {
      logger.info("Ethereal preview URL", { to, url: previewUrl });
    }

    logger.info("Email sent via SMTP", { to, messageId: info.messageId });
    return { messageId: info.messageId as string };
  } catch (error) {
    logger.error("Failed to send email via SMTP", { to, error: String(error) });
    throw error;
  }
};
