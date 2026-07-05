import { NextResponse } from "next/server";

import { fail } from "@/lib/http/apiContracts";
import { AppError } from "@/lib/http/errors";

export async function withErrorHandling<T>(action: () => Promise<NextResponse<T>>): Promise<NextResponse> {
  try {
    return await action();
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(fail(error.message, error.errors), { status: error.statusCode });
    }

    const message = error instanceof Error ? error.message : "Unexpected server error.";
    return NextResponse.json(fail("Error interno del servidor.", [message]), { status: 500 });
  }
}
