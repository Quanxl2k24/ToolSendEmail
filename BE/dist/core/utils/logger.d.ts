/**
 * Simple structured logger.
 * In production, you can replace this with Winston or Pino.
 */
export declare const logger: {
    info: (message: string, meta?: object) => void;
    warn: (message: string, meta?: object) => void;
    error: (message: string, meta?: object) => void;
    debug: (message: string, meta?: object) => void;
};
//# sourceMappingURL=logger.d.ts.map