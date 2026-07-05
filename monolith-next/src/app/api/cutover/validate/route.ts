import { NextResponse } from "next/server";

import { getLegacyApiBaseUrl } from "@/lib/config/legacyApi";

export const runtime = "nodejs";

async function ping(url: string) {
  try {
    const response = await fetch(url, { method: "GET", cache: "no-store" });
    return {
      ok: response.ok,
      status: response.status,
    };
  } catch {
    return {
      ok: false,
      status: 0,
    };
  }
}

export async function GET() {
  const legacyBaseUrl = getLegacyApiBaseUrl();
  const legacyRoot = legacyBaseUrl.replace(/\/api$/, "");
  const checks = {
    legacyHealth: await ping(`${legacyRoot}/health`),
    monolithHealth: await ping("http://localhost:3000/api/health"),
  };

  const passed = checks.legacyHealth.ok;
  return NextResponse.json(
    {
      status: passed ? "ok" : "warning",
      legacyBaseUrl,
      migratedTodos: [
        "migrar-auth-hogares",
        "migrar-modulos-financieros",
        "integrar-ui-monolito",
        "validar-corte-iis",
      ],
      checks,
      timestamp: new Date().toISOString(),
    },
    { status: passed ? 200 : 503 },
  );
}
