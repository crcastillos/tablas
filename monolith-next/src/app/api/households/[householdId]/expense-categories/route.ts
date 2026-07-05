import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/lib/auth/guards";
import { createCategory, listCategories } from "@/lib/backend/services";
import { ok } from "@/lib/http/apiContracts";
import { withErrorHandling } from "@/lib/http/routeHandler";

export const runtime = "nodejs";

interface Context {
  params: Promise<{ householdId: string }>;
}

export async function GET(request: NextRequest, context: Context) {
  return withErrorHandling(async () => {
    const auth = requireAuth(request);
    const { householdId } = await context.params;
    const data = await listCategories(householdId, auth.userId);
    return NextResponse.json(ok(data));
  });
}

export async function POST(request: NextRequest, context: Context) {
  return withErrorHandling(async () => {
    const auth = requireAuth(request);
    const { householdId } = await context.params;
    const body = (await request.json()) as {
      name: string;
      description?: string;
      categoryType: number;
      icon: string;
      color: string;
    };
    const data = await createCategory(householdId, auth.userId, body);
    return NextResponse.json(ok(data));
  });
}
