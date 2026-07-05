import {
  ExpenseCategoryType,
  ExpenseMovementType,
  ExpenseStatus,
  HouseholdRole,
  IncomeStatus,
  PaymentMethodType,
  PeriodStatus,
} from "@/frontend/types/domain";

export const householdRoleLabel = (role: HouseholdRole): string =>
  role === HouseholdRole.Owner ? "Propietario" : "Miembro";

export const incomeStatusLabel = (status: IncomeStatus): string => {
  if (status === IncomeStatus.Received) return "Recibido";
  if (status === IncomeStatus.Cancelled) return "Anulado";
  return "Pendiente";
};

export const expenseStatusLabel = (status: ExpenseStatus): string => {
  if (status === ExpenseStatus.Confirmed) return "Confirmado";
  if (status === ExpenseStatus.Cancelled) return "Anulado";
  return "Pendiente";
};

export const periodStatusLabel = (status: PeriodStatus): string => {
  if (status === PeriodStatus.Closed) return "Cerrado";
  if (status === PeriodStatus.Open) return "Abierto";
  return "Borrador";
};

export const expenseCategoryTypeOptions = Object.entries(ExpenseCategoryType).filter(([key]) =>
  Number.isNaN(Number(key)),
) as [string, ExpenseCategoryType][];

export const paymentMethodOptions = Object.entries(PaymentMethodType).filter(([key]) =>
  Number.isNaN(Number(key)),
) as [string, PaymentMethodType][];

export const expenseMovementOptions = Object.entries(ExpenseMovementType).filter(([key]) =>
  Number.isNaN(Number(key)),
) as [string, ExpenseMovementType][];

export const expenseCategoryTypeLabel = (value: ExpenseCategoryType): string =>
  expenseCategoryTypeOptions.find(([, v]) => v === value)?.[0] ?? String(value);
