export const HouseholdRole = {
  Owner: 0,
  Member: 1,
} as const;
export type HouseholdRole = (typeof HouseholdRole)[keyof typeof HouseholdRole];

export const PeriodStatus = {
  Draft: 0,
  Open: 1,
  Closed: 2,
} as const;
export type PeriodStatus = (typeof PeriodStatus)[keyof typeof PeriodStatus];

export const IncomeStatus = {
  Pending: 0,
  Received: 1,
  Cancelled: 2,
} as const;
export type IncomeStatus = (typeof IncomeStatus)[keyof typeof IncomeStatus];

export const ExpenseCategoryType = {
  Fixed: 0,
  Variable: 1,
  Savings: 2,
  Debt: 3,
} as const;
export type ExpenseCategoryType = (typeof ExpenseCategoryType)[keyof typeof ExpenseCategoryType];

export const RecurrenceFrequency = {
  Monthly: 0,
  Quarterly: 1,
  Yearly: 2,
} as const;
export type RecurrenceFrequency = (typeof RecurrenceFrequency)[keyof typeof RecurrenceFrequency];

export const ExpenseMovementType = {
  Purchase: 0,
  ServicePayment: 1,
  DebtPayment: 2,
  SavingsTransfer: 3,
  Withdrawal: 4,
  Adjustment: 5,
  Other: 6,
} as const;
export type ExpenseMovementType = (typeof ExpenseMovementType)[keyof typeof ExpenseMovementType];

export const ExpenseStatus = {
  Pending: 0,
  Confirmed: 1,
  Cancelled: 2,
} as const;
export type ExpenseStatus = (typeof ExpenseStatus)[keyof typeof ExpenseStatus];

export const PaymentMethodType = {
  Cash: 0,
  DebitCard: 1,
  CreditCard: 2,
  BankTransfer: 3,
  EWallet: 4,
  Check: 5,
  Other: 6,
} as const;
export type PaymentMethodType = (typeof PaymentMethodType)[keyof typeof PaymentMethodType];

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: string[];
}

export interface PagedResult<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
}

export interface AuthResponse {
  token: string;
  expiresAtUtc: string;
  user: UserProfile;
}

export interface Household {
  id: string;
  name: string;
  description?: string | null;
  currencyCode: string;
  timeZoneId: string;
  role: HouseholdRole;
}

export interface HouseholdMember {
  id: string;
  userId: string;
  email: string;
  displayName: string;
  role: HouseholdRole;
  canManageMembers: boolean;
  canManagePeriods: boolean;
  isActive: boolean;
}

export interface FinancialPeriod {
  id: string;
  year: number;
  month: number;
  startDate: string;
  endDate: string;
  status: PeriodStatus;
  createdAtUtc: string;
  closedAtUtc?: string | null;
}

export interface IncomeType {
  id: number;
  code: string;
  name: string;
}

export interface Income {
  id: string;
  incomeTypeId: number;
  incomeTypeName: string;
  description: string;
  estimatedAmount: number;
  receivedAmount: number;
  expectedDate?: string | null;
  receivedDate?: string | null;
  sourcePerson?: string | null;
  isRecurring: boolean;
  status: IncomeStatus;
  notes?: string | null;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  description?: string | null;
  categoryType: ExpenseCategoryType;
  icon: string;
  color: string;
  sortOrder: number;
  isActive: boolean;
  isDefault: boolean;
}

export interface RecurringExpense {
  id: string;
  categoryId: string;
  categoryName: string;
  name: string;
  description?: string | null;
  estimatedAmount: number;
  expectedPaymentDay: number;
  frequency: RecurrenceFrequency;
  startDate: string;
  endDate?: string | null;
  provider?: string | null;
  isActive: boolean;
  autoGenerateInBudget: boolean;
}

export interface BudgetLine {
  id: string;
  categoryId: string;
  categoryName: string;
  icon: string;
  color: string;
  budgetedAmount: number;
  committedAmount: number;
  spentAmount: number;
  availableAmount: number;
  consumedPercentage: number;
  notes?: string | null;
  hasBudget: boolean;
}

export interface BudgetSummary {
  totalEstimatedIncome: number;
  totalReceivedIncome: number;
  totalBudgeted: number;
  totalSpent: number;
  totalPending: number;
  estimatedCashBalance: number;
  realCashBalance: number;
  budgetBalance: number;
  assignedPercentage: number;
  exceedsIncome: boolean;
  exceedsIncomeConfirmed: boolean;
  rowVersion?: string | null;
  lines: BudgetLine[];
}

export interface Expense {
  id: string;
  categoryId: string;
  categoryName: string;
  movementType: ExpenseMovementType;
  description: string;
  amount: number;
  movementDate: string;
  paymentMethod: PaymentMethodType;
  merchantOrPayee?: string | null;
  referenceNumber?: string | null;
  status: ExpenseStatus;
  isRelatedToRecurring: boolean;
  recurringExpenseId?: string | null;
  notes?: string | null;
  createdAtUtc: string;
  createdByUserId: string;
}

export interface Dashboard {
  periodId: string;
  year: number;
  month: number;
  periodStatus: string;
  estimatedIncome: number;
  receivedIncome: number;
  totalBudgeted: number;
  confirmedExpenses: number;
  pendingExpenses: number;
  estimatedCashBalance: number;
  realCashBalance: number;
  budgetUtilizationPercentage: number;
  topCategories: CategorySpending[];
  exceededCategories: CategorySpending[];
  upcomingPayments: UpcomingPayment[];
  weeklySpending: WeeklySpending[];
  recentMovements: RecentMovement[];
  previousMonthComparison?: MonthlyComparisonSnippet | null;
}

export interface CategorySpending {
  categoryId: string;
  categoryName: string;
  color: string;
  budgeted: number;
  spent: number;
  percentage: number;
}

export interface UpcomingPayment {
  recurringExpenseId: string;
  name: string;
  amount: number;
  expectedDay: number;
  categoryName: string;
}

export interface WeeklySpending {
  weekNumber: number;
  amount: number;
}

export interface RecentMovement {
  id: string;
  description: string;
  amount: number;
  date: string;
  status: string;
  type: string;
}

export interface MonthlyComparisonSnippet {
  year: number;
  month: number;
  spent: number;
  budgeted: number;
  changePercentage: number;
}

export interface BudgetVsActualReport {
  lines: BudgetLineReport[];
  totalBudgeted: number;
  totalSpent: number;
  variance: number;
}

export interface BudgetLineReport {
  categoryName: string;
  budgeted: number;
  spent: number;
  variance: number;
  percentage: number;
}

export interface CategoryReport {
  categories: CategorySpending[];
  total: number;
}

export interface CashFlowReport {
  openingBalance: number;
  totalIncome: number;
  totalExpenses: number;
  closingBalance: number;
  items: CashFlowItem[];
}

export interface CashFlowItem {
  date: string;
  description: string;
  income: number;
  expense: number;
  balance: number;
}

export interface MonthlyComparisonReport {
  months: MonthlyComparisonItem[];
}

export interface MonthlyComparisonItem {
  year: number;
  month: number;
  estimatedIncome: number;
  receivedIncome: number;
  budgeted: number;
  spent: number;
}
