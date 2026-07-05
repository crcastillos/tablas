import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/lib/auth/guards";
import { receiveIncome } from "@/lib/backend/services";
import { ok } from "@/lib/http/apiContracts";
import { withErrorHandling } from "@/lib/http/routeHandler";

export const runtime = "nodejs";

interface Context {
  params: Promise<{ householdId: string; incomeId: string }>;
}

export async function POST(request: NextRequest, context: Context) {
  return withErrorHandling(async () => {
    const auth = requireAuth(request);
    const { householdId, incomeId } = await context.params;
    const body = (await request.json()) as { receivedAmount: number; receivedDate: string };
    const data = await receiveIncome(householdId, incomeId, auth.userId, body);
    return NextResponse.json(ok(data));
  });
}
