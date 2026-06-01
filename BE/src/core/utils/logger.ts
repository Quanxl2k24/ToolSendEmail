/**
 * Simple structured logger.
 * In production, you can replace this with Winston or Pino.
 */

type LogLevel = "info" | "warn" | "error" | "debug";

const formatMessage = (level: LogLevel, message: string, meta?: object): string => {
  const timestamp = new Date().toISOString();
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : "";
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
};

export const logger = {
  info: (message: string, meta?: object) =>
    console.log(formatMessage("info", message, meta)),

  warn: (message: string, meta?: object) =>
    console.warn(formatMessage("warn", message, meta)),

  error: (message: string, meta?: object) =>
    console.error(formatMessage("error", message, meta)),

  debug: (message: string, meta?: object) => {
    if (process.env.NODE_ENV === "development") {
      console.debug(formatMessage("debug", message, meta));
    }
  },
};
