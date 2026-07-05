import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/lib/auth/guards";
import { updateRecurringExpense } from "@/lib/backend/services";
import { ok } from "@/lib/http/apiContracts";
import { withErrorHandling } from "@/lib/http/routeHandler";

export const runtime = "nodejs";

interface Context {
  params: Promise<{ householdId: string; recurringExpenseId: string }>;
}

export async function PUT(request: NextRequest, context: Context) {
  return withErrorHandling(async () => {
    const auth = requireAuth(request);
    const { householdId, recurringExpenseId } = await context.params;
    const body = (await request.json()) as Record<string, unknown>;
    const data = await updateRecurringExpense(householdId, recurringExpenseId, auth.userId, body);
    return NextResponse.json(ok(data));
  });
}
