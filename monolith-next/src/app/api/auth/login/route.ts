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
    // #region agent log
    fetch("http://127.0.0.1:7556/ingest/94f640ef-f292-4d4c-8e4c-66a96b1ade92", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "4182c6" },
      body: JSON.stringify({
        sessionId: "4182c6",
        runId: "pre-fix",
        hypothesisId: "H1",
        location: "src/app/api/auth/login/route.ts:15",
        message: "Login request received",
        data: {
          hasEmail: Boolean(body?.email),
          emailDomain: body?.email?.includes("@") ? body.email.split("@")[1] : null,
          passwordLength: body?.password?.length ?? 0,
          rateLimitKeySource: key === "local" ? "local" : "forwarded",
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    const data = await login(body);
    // #region agent log
    fetch("http://127.0.0.1:7556/ingest/94f640ef-f292-4d4c-8e4c-66a96b1ade92", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "4182c6" },
      body: JSON.stringify({
        sessionId: "4182c6",
        runId: "pre-fix",
        hypothesisId: "H5",
        location: "src/app/api/auth/login/route.ts:35",
        message: "Login request completed",
        data: {
          tokenIssued: Boolean(data?.token),
          userIdPresent: Boolean(data?.user?.id),
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    return NextResponse.json(ok(data, "Sesión iniciada."));
  });
}
