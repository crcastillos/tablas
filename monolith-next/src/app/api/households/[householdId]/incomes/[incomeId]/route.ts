import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/lib/auth/guards";
import { updateIncome } from "@/lib/backend/services";
import { ok } from "@/lib/http/apiContracts";
import { withErrorHandling } from "@/lib/http/routeHandler";

export const runtime = "nodejs";

interface Context {
  params: Promise<{ householdId: string; incomeId: string }>;
}

export async function PUT(request: NextRequest, context: Context) {
  return withErrorHandling(async () => {
    const auth = requireAuth(request);
    const { householdId, incomeId } = await context.params;
    const body = (await request.json()) as {
      incomeTypeId: number;
      description: string;
      estimatedAmount: number;
      expectedDate?: string | null;
      sourcePerson?: string | null;
      isRecurring?: boolean;
      notes?: string | null;
    };
    const data = await updateIncome(householdId, incomeId, auth.userId, body);
    return NextResponse.json(ok(data));
  });
}
