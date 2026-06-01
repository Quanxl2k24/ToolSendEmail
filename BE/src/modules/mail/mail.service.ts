import { getSESClient } from "./aws-ses.provider.js";
import { SendEmailCommand } from "@aws-sdk/client-ses";
import { logger } from "../../core/utils/logger.js";

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  recipientName?: string;
}

export interface SendEmailResult {
  awsMessageId: string;
}

/**
 * mail.service.ts
 *
 * Core function responsible for the actual email delivery via AWS SES.
 * Uses the SESClient from aws-ses.provider.ts.
 *
 * Returns the messageId assigned by the AWS server, which is used
 * for webhook tracking (DELIVERED, BOUNCED, OPENED).
 */
export const sendEmail = async (
  options: SendEmailOptions,
): Promise<SendEmailResult> => {
  const { to, subject, html, recipientName } = options;
  // Use a verified email in AWS SES
  const fromAddress = process.env.AWS_SES_FROM || "no-reply@yourdomain.com";

  const client = getSESClient();

  const command = new SendEmailCommand({
    Destination: {
      ToAddresses: [to],
    },
    Message: {
      Body: {
        Html: {
          Charset: "UTF-8",
          Data: html,
        },
      },
      Subject: {
        Charset: "UTF-8",
        Data: subject,
      },
    },
    Source: recipientName ? `${recipientName} <${fromAddress}>` : fromAddress,
  });

  try {
    const info = await client.send(command);
    logger.info("Email sent via AWS SES", { to, awsMessageId: info.MessageId });
    return { awsMessageId: info.MessageId as string };
  } catch (error) {
    logger.error("Failed to send email via AWS SES", { to, error: String(error) });
    throw error;
  }
};
