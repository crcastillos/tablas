import { NextRequest, NextResponse } from "next/server";

import { login } from "@/lib/backend/services";
import { ok } from "@/lib/http/apiContracts";
import { enforceLoginRateLimit } from "@/lib/http/rateLimit";
import { withErrorHandling } from "@/lib/http/routeHandler";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const key = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "local";
    enforceLoginRateLimit(key);
    const body = (await request.json()) as { email: string; password: string };
    const data = await login(body);
    return NextResponse.json(ok(data, "Sesión iniciada."));
  });
}
