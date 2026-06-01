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
export declare const sendEmail: (options: SendEmailOptions) => Promise<SendEmailResult>;
//# sourceMappingURL=mail.service.d.ts.map