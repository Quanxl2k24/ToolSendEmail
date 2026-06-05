import crypto from "crypto";
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
function getEncryptionKey() {
    const key = process.env.TOKEN_ENCRYPTION_KEY;
    if (!key) {
        throw new Error("TOKEN_ENCRYPTION_KEY is not set. Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"");
    }
    return Buffer.from(key, "hex");
}
export function encryptToken(plaintext) {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(plaintext, "utf8", "base64");
    encrypted += cipher.final("base64");
    const tag = cipher.getAuthTag();
    const ivBase64 = iv.toString("base64");
    const tagBase64 = tag.toString("base64");
    return `${ivBase64}:${tagBase64}:${encrypted}`;
}
export function decryptToken(encoded) {
    const key = getEncryptionKey();
    const parts = encoded.split(":");
    if (parts.length !== 3) {
        throw new Error("Invalid encrypted token format");
    }
    const iv = Buffer.from(parts[0], "base64");
    const tag = Buffer.from(parts[1], "base64");
    const encrypted = parts[2];
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    let decrypted = decipher.update(encrypted, "base64", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
}
//# sourceMappingURL=crypto.util.js.map