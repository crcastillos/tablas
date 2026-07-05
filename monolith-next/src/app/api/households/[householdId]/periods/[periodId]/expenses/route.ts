import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/lib/auth/guards";
import { createExpense, listExpenses } from "@/lib/backend/services";
import { ok } from "@/lib/http/apiContracts";
import { withErrorHandling } from "@/lib/http/routeHandler";

export const runtime = "nodejs";

interface Context {
  params: Promise<{ householdId: string; periodId: string }>;
}

export async function GET(request: NextRequest, context: Context) {
  return withErrorHandling(async () => {
    const auth = requireAuth(request);
    const { householdId, periodId } = await context.params;
    const data = await listExpenses(householdId, periodId, auth.userId, request.nextUrl.searchParams);
    return NextResponse.json(ok(data));
  });
}

export async function POST(request: NextRequest, context: Context) {
  return withErrorHandling(async () => {
    const auth = requireAuth(request);
    const { householdId, periodId } = await context.params;
    const body = (await request.json()) as Record<string, unknown>;
    const data = await createExpense(householdId, periodId, auth.userId, body);
    return NextResponse.json(ok(data));
  });
}
