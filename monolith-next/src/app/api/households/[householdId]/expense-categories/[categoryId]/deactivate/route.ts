import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/lib/auth/guards";
import { deactivateCategory } from "@/lib/backend/services";
import { withErrorHandling } from "@/lib/http/routeHandler";

export const runtime = "nodejs";

interface Context {
  params: Promise<{ householdId: string; categoryId: string }>;
}

export async function POST(request: NextRequest, context: Context) {
  return withErrorHandling(async () => {
    const auth = requireAuth(request);
    const { householdId, categoryId } = await context.params;
    await deactivateCategory(householdId, categoryId, auth.userId);
    return new NextResponse(null, { status: 204 });
  });
}
