import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/lib/auth/guards";
import { cancelExpense } from "@/lib/backend/services";
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
    const body = (await request.json()) as { reason: string };
    const data = await cancelExpense(householdId, expenseId, auth.userId, body);
    return NextResponse.json(ok(data));
  });
}
