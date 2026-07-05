import { NextRequest, NextResponse } from "next/server";

import { ok } from "@/lib/http/apiContracts";
import { withErrorHandling } from "@/lib/http/routeHandler";
import { register } from "@/lib/backend/services";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const body = (await request.json()) as { email: string; password: string; displayName: string };
    const data = await register(body);
    return NextResponse.json(ok(data, "Usuario registrado."), { status: 201 });
  });
}
