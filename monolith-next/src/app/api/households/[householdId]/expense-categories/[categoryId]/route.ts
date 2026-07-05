import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/lib/auth/guards";
import { updateCategory } from "@/lib/backend/services";
import { ok } from "@/lib/http/apiContracts";
import { withErrorHandling } from "@/lib/http/routeHandler";

export const runtime = "nodejs";

interface Context {
  params: Promise<{ householdId: string; categoryId: string }>;
}

export async function PUT(request: NextRequest, context: Context) {
  return withErrorHandling(async () => {
    const auth = requireAuth(request);
    const { householdId, categoryId } = await context.params;
    const body = (await request.json()) as {
      name: string;
      description?: string;
      categoryType: number;
      icon: string;
      color: string;
    };
    const data = await updateCategory(householdId, categoryId, auth.userId, body);
    return NextResponse.json(ok(data));
  });
}
