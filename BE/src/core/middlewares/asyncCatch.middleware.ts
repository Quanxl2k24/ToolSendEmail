import type { Request, Response, NextFunction, RequestHandler } from "express";

type AsyncHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<any>;

/**
 * Wraps an async route handler to automatically catch errors and forward to next().
 * Eliminates the need for try/catch blocks in every controller.
 */
const asyncCatch = (fn: AsyncHandler): RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default asyncCatch;
