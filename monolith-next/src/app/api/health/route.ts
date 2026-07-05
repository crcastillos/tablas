import { NextResponse } from "next/server";

import { getJwtConfig, validateBootstrapEnvironment } from "@/lib/config/env";
import { getSqlPool } from "@/lib/sql/sqlServer";

export const runtime = "nodejs";

export async function GET() {
  try {
    validateBootstrapEnvironment();
    const pool = await getSqlPool();
    const queryResult = await pool.request().query("SELECT 1 AS ok");
    const dbReady = queryResult.recordset[0]?.ok === 1;
    const jwt = getJwtConfig();

    return NextResponse.json({
      status: "ok",
      bootstrapReady: true,
      dbReady,
      jwtIssuer: jwt.issuer,
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
