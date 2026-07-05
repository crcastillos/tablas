import { NextResponse } from "next/server";

import { getSqlPool } from "@/lib/sql/sqlServer";

export const runtime = "nodejs";

export async function GET() {
  try {
    const pool = await getSqlPool();
    const dbCheck = await pool.request().query("SELECT 1 AS ok");
    const dbReady = dbCheck.recordset[0]?.ok === 1;
    const requiredRoutes = [
      "/api/auth/login",
      "/api/auth/me",
      "/api/households",
      "/api/income-types",
      "/api/health",
    ];
    return NextResponse.json(
      {
        status: dbReady ? "ok" : "warning",
        backendMode: "next-native",
        legacyProxyRemoved: true,
        checks: {
          sqlServer: dbReady,
        },
        requiredRoutes,
        timestamp: new Date().toISOString(),
      },
      { status: dbReady ? 200 : 503 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Cutover validation failed.";
    return NextResponse.json(
      {
        status: "error",
        backendMode: "next-native",
        legacyProxyRemoved: true,
        message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
