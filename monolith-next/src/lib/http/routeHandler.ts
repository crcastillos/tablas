import { NextResponse } from "next/server";

import { fail } from "@/lib/http/apiContracts";
import { AppError } from "@/lib/http/errors";

export async function withErrorHandling<T>(action: () => Promise<NextResponse<T>>): Promise<NextResponse> {
  try {
    return await action();
  } catch (error) {
    if (error instanceof AppError) {
      // #region agent log
      fetch("http://127.0.0.1:7556/ingest/94f640ef-f292-4d4c-8e4c-66a96b1ade92", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "4182c6" },
        body: JSON.stringify({
          sessionId: "4182c6",
          runId: "pre-fix",
          hypothesisId: "H6",
          location: "src/lib/http/routeHandler.ts:12",
          message: "Handled AppError in route wrapper",
          data: {
            statusCode: error.statusCode,
            message: error.message,
            hasErrorsArray: Array.isArray(error.errors),
            errorsCount: Array.isArray(error.errors) ? error.errors.length : 0,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      return NextResponse.json(fail(error.message, error.errors), { status: error.statusCode });
    }

    const message = error instanceof Error ? error.message : "Unexpected server error.";
    // #region agent log
    fetch("http://127.0.0.1:7556/ingest/94f640ef-f292-4d4c-8e4c-66a96b1ade92", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "4182c6" },
      body: JSON.stringify({
        sessionId: "4182c6",
        runId: "pre-fix",
        hypothesisId: "H6",
        location: "src/lib/http/routeHandler.ts:31",
        message: "Unhandled non-AppError in route wrapper",
        data: {
          inferredMessage: message,
          errorType: error instanceof Error ? error.name : typeof error,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    return NextResponse.json(fail("Error interno del servidor.", [message]), { status: 500 });
  }
}
