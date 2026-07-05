import crypto from "crypto";

import { getJwtConfig } from "@/lib/config/env";
import { UnauthorizedError } from "@/lib/http/errors";

interface JwtPayload {
  sub: string;
  email: string;
  jti: string;
  iat: number;
  exp: number;
  iss: string;
  aud: string;
}

function base64UrlEncode(value: Buffer | string): string {
  const buffer = Buffer.isBuffer(value) ? value : Buffer.from(value, "utf8");
  return buffer.toString("base64url");
}

function base64UrlDecode(value: string): Buffer {
  return Buffer.from(value, "base64url");
}

export interface AuthTokenResult {
  token: string;
  expiresAtUtc: string;
}

export function createJwtToken(userId: string, email: string): AuthTokenResult {
  const jwt = getJwtConfig();
  const now = Math.floor(Date.now() / 1000);
  const exp = now + jwt.expiresMinutes * 60;
  const header = { alg: "HS256", typ: "JWT" };
  const payload: JwtPayload = {
    sub: userId,
    email,
    jti: crypto.randomUUID(),
    iat: now,
    exp,
    iss: jwt.issuer,
    aud: jwt.audience,
  };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto.createHmac("sha256", jwt.secret).update(unsignedToken).digest("base64url");
  return {
    token: `${unsignedToken}.${signature}`,
    expiresAtUtc: new Date(exp * 1000).toISOString(),
  };
}

export interface AuthUser {
  userId: string;
  email: string;
}

export function verifyJwtToken(token: string): AuthUser {
  const jwt = getJwtConfig();
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new UnauthorizedError("Token inválido.");
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;
  const expectedSignature = crypto.createHmac("sha256", jwt.secret).update(unsignedToken).digest();
  const providedSignature = base64UrlDecode(encodedSignature);

  if (providedSignature.length !== expectedSignature.length || !crypto.timingSafeEqual(providedSignature, expectedSignature)) {
    throw new UnauthorizedError("Token inválido.");
  }

  const payload = JSON.parse(base64UrlDecode(encodedPayload).toString("utf8")) as JwtPayload;
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp <= now || payload.iss !== jwt.issuer || payload.aud !== jwt.audience || !payload.sub) {
    throw new UnauthorizedError("Token expirado o inválido.");
  }

  return {
    userId: payload.sub,
    email: payload.email,
  };
}
