import { SESClient } from "@aws-sdk/client-ses";
/**
 * aws-ses.provider.ts
 *
 * Configures the AWS SES Client using credentials from .env.
 */
let sesClient = null;
export const getSESClient = () => {
    if (sesClient)
        return sesClient;
    // Uses AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_REGION automatically
    sesClient = new SESClient({
        region: process.env.AWS_REGION || "us-east-1",
    });
    return sesClient;
};
//# sourceMappingURL=aws-ses.provider.js.map