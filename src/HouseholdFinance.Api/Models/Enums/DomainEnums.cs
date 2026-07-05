namespace HouseholdFinance.Api.Models.Enums;

public enum HouseholdRole { Owner = 0, Member = 1 }
public enum PeriodStatus { Draft = 0, Open = 1, Closed = 2 }
public enum IncomeStatus { Pending = 0, Received = 1, Cancelled = 2 }
public enum ExpenseCategoryType { Fixed = 0, Variable = 1, Savings = 2, Debt = 3 }
public enum RecurrenceFrequency { Monthly = 0, Quarterly = 1, Yearly = 2 }
public enum ExpenseMovementType { Purchase = 0, ServicePayment = 1, DebtPayment = 2, SavingsTransfer = 3, Withdrawal = 4, Adjustment = 5, Other = 6 }
public enum ExpenseStatus { Pending = 0, Confirmed = 1, Cancelled = 2 }
public enum PaymentMethodType { Cash = 0, DebitCard = 1, CreditCard = 2, BankTransfer = 3, EWallet = 4, Check = 5, Other = 6 }
