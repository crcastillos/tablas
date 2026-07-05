import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/lib/auth/guards";
import { getIncomeTypes } from "@/lib/backend/services";
import { ok } from "@/lib/http/apiContracts";
import { withErrorHandling } from "@/lib/http/routeHandler";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    const auth = requireAuth(request);
    const data = await getIncomeTypes(auth.userId);
    return NextResponse.json(ok(data));
  });
}
