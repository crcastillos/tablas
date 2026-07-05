import { NextResponse } from "next/server";

import { getJwtEnvironment, validateBootstrapEnvironment } from "@/lib/config/env";

export const runtime = "nodejs";

export async function GET() {
  try {
    validateBootstrapEnvironment();

    return NextResponse.json({
      status: "ok",
      bootstrapReady: true,
      jwtVariableCount: Object.keys(getJwtEnvironment()).length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown bootstrap environment error";

    return NextResponse.json(
      {
        status: "error",
        bootstrapReady: false,
        message,
      },
      { status: 500 }
    );
  }
}
