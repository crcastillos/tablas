import { NextRequest, NextResponse } from "next/server";

import { buildArielFinancialContext } from "@/lib/ai/arielContext";
import { requestArielAnswer } from "@/lib/ai/openaiResponses";
import { requireAuth } from "@/lib/auth/guards";
import { ok } from "@/lib/http/apiContracts";
import { BadRequestError } from "@/lib/http/errors";
import { withErrorHandling } from "@/lib/http/routeHandler";

export const runtime = "nodejs";

interface ArielChatRequest {
  message?: string;
  householdId?: string;
  periodId?: string;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function requireUuid(value: string | undefined, fieldName: string): string {
  const normalized = value?.trim() ?? "";
  if (!UUID_REGEX.test(normalized)) {
    throw new BadRequestError(`${fieldName} inválido.`);
  }
  return normalized;
}

function requireMessage(message: string | undefined): string {
  const normalized = message?.trim() ?? "";
  if (!normalized) {
    throw new BadRequestError("El mensaje es obligatorio.");
  }
  if (normalized.length > 2000) {
    throw new BadRequestError("El mensaje excede el límite de 2000 caracteres.");
  }
  return normalized;
}

function formatPeriodLabel(year: number, month: number): string {
  const normalizedMonth = String(month).padStart(2, "0");
  return `${year}-${normalizedMonth}`;
}

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const auth = requireAuth(request);
    let body: ArielChatRequest;
    try {
      body = (await request.json()) as ArielChatRequest;
    } catch {
      throw new BadRequestError("El cuerpo de la solicitud no es JSON válido.");
    }

    const userMessage = requireMessage(body.message);
    const householdId = requireUuid(body.householdId, "householdId");
    const periodId = requireUuid(body.periodId, "periodId");
    const financialContext = await buildArielFinancialContext(householdId, periodId, auth.userId);
    const financialContextJson = JSON.stringify(financialContext, null, 2);
    const answer = await requestArielAnswer({
      householdName: financialContext.household.name,
      householdId: financialContext.household.id,
      periodLabel: formatPeriodLabel(financialContext.period.year, financialContext.period.month),
      periodId: financialContext.period.id,
      currencyCode: financialContext.household.currencyCode,
      timeZoneId: financialContext.household.timeZoneId,
      financialContextJson,
      userMessage,
    });

    return NextResponse.json(
      ok({
        reply: answer,
        context: {
          householdId: financialContext.household.id,
          householdName: financialContext.household.name,
          periodId: financialContext.period.id,
          periodLabel: formatPeriodLabel(financialContext.period.year, financialContext.period.month),
          currencyCode: financialContext.household.currencyCode,
        },
      }),
    );
  });
}
