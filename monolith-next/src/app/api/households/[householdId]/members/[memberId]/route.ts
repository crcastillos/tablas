import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/lib/auth/guards";
import { removeMember, updateMember } from "@/lib/backend/services";
import { ok } from "@/lib/http/apiContracts";
import { withErrorHandling } from "@/lib/http/routeHandler";

export const runtime = "nodejs";

interface Context {
  params: Promise<{ householdId: string; memberId: string }>;
}

export async function DELETE(request: NextRequest, context: Context) {
  return withErrorHandling(async () => {
    const auth = requireAuth(request);
    const { householdId, memberId } = await context.params;
    await removeMember(householdId, auth.userId, memberId);
    return new NextResponse(null, { status: 204 });
  });
}

export async function PUT(request: NextRequest, context: Context) {
  return withErrorHandling(async () => {
    const auth = requireAuth(request);
    const { householdId, memberId } = await context.params;
    const body = (await request.json()) as {
      role: 0 | 1;
      canManageMembers: boolean;
      canManagePeriods: boolean;
      isActive: boolean;
    };
    const data = await updateMember(householdId, auth.userId, memberId, body);
    return NextResponse.json(ok(data, "Integrante actualizado."));
  });
}
