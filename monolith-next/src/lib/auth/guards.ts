import { NextRequest } from "next/server";

import { verifyJwtToken, type AuthUser } from "@/lib/auth/jwt";
import { UnauthorizedError } from "@/lib/http/errors";

export function requireAuth(request: NextRequest): AuthUser {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new UnauthorizedError("No se pudo identificar al usuario.");
  }

  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) {
    throw new UnauthorizedError("No se pudo identificar al usuario.");
  }

  return verifyJwtToken(token);
}
