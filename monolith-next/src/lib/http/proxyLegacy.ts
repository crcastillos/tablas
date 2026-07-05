import "server-only";

import { NextRequest, NextResponse } from "next/server";

import { getLegacyApiBaseUrl } from "@/lib/config/legacyApi";

const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "host",
]);

function getForwardHeaders(request: NextRequest): Headers {
  const headers = new Headers();

  request.headers.forEach((value, key) => {
    if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  });

  return headers;
}

export async function proxyToLegacyApi(
  request: NextRequest,
  pathSegments: string[],
): Promise<NextResponse> {
  const baseUrl = getLegacyApiBaseUrl();
  const targetUrl = new URL(`${baseUrl}/${pathSegments.join("/")}`);
  request.nextUrl.searchParams.forEach((value, key) => targetUrl.searchParams.append(key, value));

  const method = request.method.toUpperCase();
  const body =
    method === "GET" || method === "HEAD" ? undefined : await request.text();

  const response = await fetch(targetUrl, {
    method,
    headers: getForwardHeaders(request),
    body,
    cache: "no-store",
  });

  const responseHeaders = new Headers(response.headers);
  HOP_BY_HOP_HEADERS.forEach((header) => responseHeaders.delete(header));

  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
}
