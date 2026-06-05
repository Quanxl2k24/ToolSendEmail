export interface SendEmailOptions {
    to: string;
    subject: string;
    html: string;
    recipientName?: string;
}
export interface SendEmailResult {
    messageId: string;
}
export declare const sendEmail: (options: SendEmailOptions) => Promise<SendEmailResult>;
//# sourceMappingURL=mail.service.d.ts.map