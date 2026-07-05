import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/lib/auth/guards";
import { getExpenseById, updateExpense } from "@/lib/backend/services";
import { ok } from "@/lib/http/apiContracts";
import { withErrorHandling } from "@/lib/http/routeHandler";

export const runtime = "nodejs";

interface Context {
  params: Promise<{ householdId: string; expenseId: string }>;
}

export async function GET(request: NextRequest, context: Context) {
  return withErrorHandling(async () => {
    const auth = requireAuth(request);
    const { householdId, expenseId } = await context.params;
    const data = await getExpenseById(householdId, expenseId, auth.userId);
    return NextResponse.json(ok(data));
  });
}

export async function PUT(request: NextRequest, context: Context) {
  return withErrorHandling(async () => {
    const auth = requireAuth(request);
    const { householdId, expenseId } = await context.params;
    const body = (await request.json()) as Record<string, unknown>;
    const data = await updateExpense(householdId, expenseId, auth.userId, body);
    return NextResponse.json(ok(data));
  });
}
