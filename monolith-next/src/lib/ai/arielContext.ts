import "server-only";

import {
  getBudgetSummary,
  getDashboard,
  getHousehold,
  getPeriodById,
  listExpenses,
  listIncomes,
  reportBudgetVsActual,
  reportByCategory,
  reportCashFlow,
  reportMonthlyComparison,
} from "@/lib/backend/services";

export interface ArielFinancialContext {
  household: {
    id: string;
    name: string;
    currencyCode: string;
    timeZoneId: string;
  };
  period: {
    id: string;
    year: number;
    month: number;
    startDate: string | null;
    endDate: string | null;
    status: number;
  };
  dashboard: Awaited<ReturnType<typeof getDashboard>>;
  budgetSummary: Awaited<ReturnType<typeof getBudgetSummary>>;
  reports: {
    budgetVsActual: Awaited<ReturnType<typeof reportBudgetVsActual>>;
    byCategory: Awaited<ReturnType<typeof reportByCategory>>;
    cashFlow: Awaited<ReturnType<typeof reportCashFlow>>;
    monthlyComparison: Awaited<ReturnType<typeof reportMonthlyComparison>>;
  };
  periodData: {
    incomes: Awaited<ReturnType<typeof listIncomes>>;
    expenses: Awaited<ReturnType<typeof listExpenses>>["items"];
    expensesPageInfo: {
      pageNumber: number;
      pageSize: number;
      totalItems: number;
      totalPages: number;
    };
  };
}

interface HouseholdContext {
  id: string;
  name: string;
  currencyCode: string;
  timeZoneId: string;
}

function toHouseholdContext(value: unknown): HouseholdContext {
  if (!value || typeof value !== "object") {
    throw new Error("No se pudo obtener el hogar autorizado para ARIEL.");
  }

  const candidate = value as Record<string, unknown>;
  if (
    typeof candidate.id !== "string" ||
    typeof candidate.name !== "string" ||
    typeof candidate.currencyCode !== "string" ||
    typeof candidate.timeZoneId !== "string"
  ) {
    throw new Error("El hogar autorizado no contiene la estructura esperada para ARIEL.");
  }

  return {
    id: candidate.id,
    name: candidate.name,
    currencyCode: candidate.currencyCode,
    timeZoneId: candidate.timeZoneId,
  };
}

export async function buildArielFinancialContext(householdId: string, periodId: string, userId: string): Promise<ArielFinancialContext> {
  const [householdResult, period] = await Promise.all([getHousehold(householdId, userId), getPeriodById(householdId, periodId, userId)]);
  const household = toHouseholdContext(householdResult);

  const expensesParams = new URLSearchParams();
  expensesParams.set("pageNumber", "1");
  expensesParams.set("pageSize", "100");

  const [dashboard, budgetSummary, budgetVsActual, byCategory, cashFlow, monthlyComparison, incomes, expensesPage] = await Promise.all([
    getDashboard(householdId, periodId, userId),
    getBudgetSummary(householdId, periodId, userId),
    reportBudgetVsActual(householdId, periodId, userId),
    reportByCategory(householdId, periodId, userId),
    reportCashFlow(householdId, periodId, userId),
    reportMonthlyComparison(householdId, userId, 6),
    listIncomes(householdId, periodId, userId),
    listExpenses(householdId, periodId, userId, expensesParams),
  ]);

  return {
    household: {
      id: household.id,
      name: household.name,
      currencyCode: household.currencyCode,
      timeZoneId: household.timeZoneId,
    },
    period: {
      id: period.id,
      year: period.year,
      month: period.month,
      startDate: period.startDate,
      endDate: period.endDate,
      status: period.status,
    },
    dashboard,
    budgetSummary,
    reports: {
      budgetVsActual,
      byCategory,
      cashFlow,
      monthlyComparison,
    },
    periodData: {
      incomes,
      expenses: expensesPage.items,
      expensesPageInfo: {
        pageNumber: expensesPage.pageNumber,
        pageSize: expensesPage.pageSize,
        totalItems: expensesPage.totalItems,
        totalPages: expensesPage.totalPages,
      },
    },
  };
}
