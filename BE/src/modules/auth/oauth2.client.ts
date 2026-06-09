import { google } from "googleapis";
import jwt from "jsonwebtoken";
import type { OAuth2Client } from "google-auth-library";

let oauth2Client: OAuth2Client | null = null;

function getEnvOrThrow(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`${key} is not set`);
  return value;
}

export function getOAuth2Client(): OAuth2Client {
  if (oauth2Client) return oauth2Client;

  oauth2Client = new google.auth.OAuth2(
    getEnvOrThrow("GOOGLE_CLIENT_ID"),
    getEnvOrThrow("GOOGLE_CLIENT_SECRET"),
    getEnvOrThrow("GOOGLE_REDIRECT_URI"),
  );

  return oauth2Client;
}

export function generateAuthUrl(state?: string): string {
  const client = getOAuth2Client();
  const opts: Parameters<typeof client.generateAuthUrl>[0] = {
    access_type: "offline" as const,
    prompt: "consent" as const,
    scope: [
      "openid",
      "email",
      "profile",
      "https://www.googleapis.com/auth/spreadsheets",
    ],
  };
  if (state !== undefined) opts.state = state;
  return client.generateAuthUrl(opts);
}

export async function exchangeCodeForTokens(code: string) {
  const client = getOAuth2Client();
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);

  let userInfo: {
    sub: string;
    email: string;
    name: string;
    picture?: string;
  } | null = null;

  if (tokens.id_token) {
    const decoded = jwt.decode(tokens.id_token) as Record<string, unknown> | null;
    if (decoded && typeof decoded.sub === "string" && typeof decoded.email === "string") {
      userInfo = {
        sub: decoded.sub,
        email: decoded.email,
        name: typeof decoded.name === "string" ? decoded.name : decoded.email,
      };
      if (typeof decoded.picture === "string") {
        userInfo.picture = decoded.picture;
      }
    }
  }

  return {
    accessToken: tokens.access_token!,
    refreshToken: tokens.refresh_token ?? null,
    expiresIn: tokens.expiry_date
      ? Math.floor((tokens.expiry_date - Date.now()) / 1000)
      : null,
    userInfo,
  };
}
