import nodemailer from "nodemailer";
import { logger } from "../../core/utils/logger.js";
let transporter = null;
let initPromise = null;
const initializeTransporter = async () => {
    if (process.env.SMTP_MODE === "sandbox") {
        const testAccount = await nodemailer.createTestAccount();
        logger.info("Ethereal sandbox account created", {
            user: testAccount.user,
            pass: testAccount.pass,
            webUrl: "https://ethereal.email/login",
        });
        transporter = nodemailer.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            secure: false,
            auth: { user: testAccount.user, pass: testAccount.pass },
        });
    }
    else {
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT ?? 587),
            secure: Number(process.env.SMTP_PORT ?? 587) === 465,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }
    await new Promise((resolve, reject) => {
        transporter.verify((error) => {
            if (error) {
                logger.error("SMTP connection failed", { error: String(error) });
                reject(error);
            }
            else {
                logger.info("SMTP server is ready to send emails.");
                resolve();
            }
        });
    });
};
export const getMailTransporter = async () => {
    if (initPromise) {
        await initPromise;
        return transporter;
    }
    initPromise = initializeTransporter();
    await initPromise;
    return transporter;
};
// Eager initialization: bắt đầu connect SMTP ngay khi module load,
// không chặn server startup nhưng log sẽ xuất hiện sớm
initPromise = initializeTransporter().catch((err) => {
    logger.error("SMTP initialization failed (will retry on first send)", {
        error: String(err),
    });
    // Reset để lần gọi đầu tiên của getMailTransporter sẽ thử lại
    initPromise = null;
});
export const getSenderAddress = () => {
    return process.env.SMTP_FROM || process.env.SMTP_USER || "no-reply@localhost";
};
export const getTestMessageUrl = (info) => {
    if (process.env.SMTP_MODE !== "sandbox")
        return null;
    const url = nodemailer.getTestMessageUrl(info);
    return url || null;
};
//# sourceMappingURL=mail.provider.js.map