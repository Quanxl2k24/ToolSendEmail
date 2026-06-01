import type { Request, Response, NextFunction, RequestHandler } from "express";
type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<any>;
/**
 * Wraps an async route handler to automatically catch errors and forward to next().
 * Eliminates the need for try/catch blocks in every controller.
 */
declare const asyncCatch: (fn: AsyncHandler) => RequestHandler;
export default asyncCatch;
//# sourceMappingURL=asyncCatch.middleware.d.ts.map