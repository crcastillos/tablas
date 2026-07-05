import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/lib/auth/guards";
import { deactivateRecurringExpense } from "@/lib/backend/services";
import { withErrorHandling } from "@/lib/http/routeHandler";

export const runtime = "nodejs";

interface Context {
  params: Promise<{ householdId: string; recurringExpenseId: string }>;
}

export async function POST(request: NextRequest, context: Context) {
  return withErrorHandling(async () => {
    const auth = requireAuth(request);
    const { householdId, recurringExpenseId } = await context.params;
    await deactivateRecurringExpense(householdId, recurringExpenseId, auth.userId);
    return new NextResponse(null, { status: 204 });
  });
}
