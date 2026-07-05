import { NextResponse } from "next/server";

import { ok } from "@/lib/http/apiContracts";

export const runtime = "nodejs";

export async function POST() {
  return NextResponse.json(ok({}, "Cierre de sesión exitoso."));
}
