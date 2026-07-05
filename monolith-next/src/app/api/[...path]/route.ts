import { NextRequest, NextResponse } from "next/server";

import { proxyToLegacyApi } from "@/lib/http/proxyLegacy";

export const runtime = "nodejs";

const MIGRATED_PREFIXES = new Set([
  "auth",
  "households",
  "income-types",
]);

function isSupportedApiPath(pathSegments: string[]): boolean {
  if (pathSegments.length === 0) {
    return false;
  }

  return MIGRATED_PREFIXES.has(pathSegments[0]);
}

async function handleRequest(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;

  if (!isSupportedApiPath(path)) {
    return NextResponse.json(
      {
        success: false,
        message:
          "Endpoint aun no migrado en monolith-next. Use /api/auth, /api/households o /api/income-types.",
      },
      { status: 404 },
    );
  }

  return proxyToLegacyApi(request, path);
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  return handleRequest(request, context);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  return handleRequest(request, context);
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  return handleRequest(request, context);
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  return handleRequest(request, context);
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  return handleRequest(request, context);
}
