import jwt from "jsonwebtoken";

export interface JwtPayload {
  sub: string;
  email: string;
  name: string;
  picture?: string;
}

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return secret;
}

export function signJwt(payload: JwtPayload, expiresIn?: string): string {
  return jwt.sign(payload as object, getSecret(), {
    expiresIn: expiresIn ?? process.env.JWT_EXPIRES_IN ?? "15m",
  } as jwt.SignOptions);
}

export function verifyJwt(token: string): JwtPayload {
  return jwt.verify(token, getSecret()) as JwtPayload;
}

export function verifyJwtIgnoreExpiry(token: string): JwtPayload {
  return jwt.verify(token, getSecret(), { ignoreExpiration: true }) as JwtPayload;
}
