import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/lib/auth/guards";
import { createHousehold, listHouseholds } from "@/lib/backend/services";
import { ok } from "@/lib/http/apiContracts";
import { withErrorHandling } from "@/lib/http/routeHandler";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    const auth = requireAuth(request);
    const data = await listHouseholds(auth.userId);
    return NextResponse.json(ok(data));
  });
}

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const auth = requireAuth(request);
    const body = (await request.json()) as { name: string; description?: string };
    const data = await createHousehold(auth.userId, body);
    return NextResponse.json(ok(data, "Hogar creado."), { status: 201 });
  });
}
