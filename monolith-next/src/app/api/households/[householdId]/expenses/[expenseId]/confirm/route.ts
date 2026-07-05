import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/lib/auth/guards";
import { confirmExpense } from "@/lib/backend/services";
import { ok } from "@/lib/http/apiContracts";
import { withErrorHandling } from "@/lib/http/routeHandler";

export const runtime = "nodejs";

interface Context {
  params: Promise<{ householdId: string; expenseId: string }>;
}

export async function POST(request: NextRequest, context: Context) {
  return withErrorHandling(async () => {
    const auth = requireAuth(request);
    const { householdId, expenseId } = await context.params;
    const data = await confirmExpense(householdId, expenseId, auth.userId);
    return NextResponse.json(ok(data));
  });
}
