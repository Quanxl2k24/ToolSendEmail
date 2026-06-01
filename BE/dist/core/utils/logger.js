/**
 * Simple structured logger.
 * In production, you can replace this with Winston or Pino.
 */
const formatMessage = (level, message, meta) => {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : "";
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
};
export const logger = {
    info: (message, meta) => console.log(formatMessage("info", message, meta)),
    warn: (message, meta) => console.warn(formatMessage("warn", message, meta)),
    error: (message, meta) => console.error(formatMessage("error", message, meta)),
    debug: (message, meta) => {
        if (process.env.NODE_ENV === "development") {
            console.debug(formatMessage("debug", message, meta));
        }
    },
};
//# sourceMappingURL=logger.js.map