import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/lib/auth/guards";
import { addMember, listMembers } from "@/lib/backend/services";
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
    const data = await listMembers(householdId, auth.userId);
    return NextResponse.json(ok(data));
  });
}

export async function POST(request: NextRequest, context: Context) {
  return withErrorHandling(async () => {
    const auth = requireAuth(request);
    const { householdId } = await context.params;
    const body = (await request.json()) as {
      email: string;
      role: 0 | 1;
      canManageMembers: boolean;
      canManagePeriods: boolean;
    };
    const data = await addMember(householdId, auth.userId, body);
    return NextResponse.json(ok(data, "Integrante agregado."), { status: 201 });
  });
}
