import type { Request, Response, NextFunction } from "express";
/**
 * Google OAuth2 Auth Middleware
 *
 * Strategy: Validate Google OAuth2 Access Token passed in the Authorization header.
 * The frontend must obtain the token via Google Sign-In and send it as:
 *   Authorization: Bearer <google_access_token>
 *
 * The middleware verifies the token using Google's tokeninfo endpoint and
 * attaches the user info to req.user.
 */
export interface GoogleUser {
    sub: string;
    email: string;
    name: string;
    picture?: string;
    accessToken: string;
}
declare global {
    namespace Express {
        interface Request {
            user?: GoogleUser;
        }
    }
}
export declare const googleAuthMiddleware: (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=auth.middleware.d.ts.map