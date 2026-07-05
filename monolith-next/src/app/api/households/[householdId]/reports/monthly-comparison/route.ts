import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/lib/auth/guards";
import { reportMonthlyComparison } from "@/lib/backend/services";
import { ok } from "@/lib/http/apiContracts";
import { withErrorHandling } from "@/lib/http/routeHandler";

export const runtime = "nodejs";

interface Context {
  params: Promise<{ householdId: string }>;
}

export async function GET(request: NextRequest, context: Context) {
  return withErrorHandling(async () => {
    const auth = requireAuth(request);
    const { householdId } = await context.params;
    const months = Number(request.nextUrl.searchParams.get("months") ?? 6);
    const data = await reportMonthlyComparison(householdId, auth.userId, months);
    return NextResponse.json(ok(data));
  });
}
