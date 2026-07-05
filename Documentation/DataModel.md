# Modelo de datos

## Identity

- **ApplicationUser** — Id, Email, DisplayName (Identity)

## Fase 1

| Tabla | Campos clave |
|---|---|
| Households | Id, Name, CurrencyCode, TimeZoneId |
| HouseholdMembers | HouseholdId, UserId, Role, CanManageMembers, CanManagePeriods, IsActive |
| FinancialPeriods | HouseholdId, Year, Month, Status, StartDate, EndDate |
| AuditLogs | EntityType, EntityId, Action, UserId, TimestampUtc, Details |

## Fase 2

| Tabla | Campos clave |
|---|---|
| IncomeTypes | Id, Code, Name (catálogo) |
| Incomes | PeriodId, IncomeTypeId, EstimatedAmount, ReceivedAmount, Status |
| ExpenseCategories | HouseholdId, Name, CategoryType, IsActive, IsDefault |
| RecurringExpenses | HouseholdId, CategoryId, EstimatedAmount, Frequency |
| MonthlyBudgets | PeriodId, RowVersion, ExceedsIncomeConfirmed |
| BudgetLines | BudgetId, CategoryId, BudgetedAmount |

## Fase 3

| Tabla | Campos clave |
|---|---|
| Expenses | PeriodId, CategoryId, Amount, Status, PaymentMethod, IdempotencyKey |

## Relaciones

```text
Household 1──* HouseholdMember
Household 1──* FinancialPeriod
Household 1──* ExpenseCategory
Household 1──* RecurringExpense
FinancialPeriod 1──* Income
FinancialPeriod 0..1── MonthlyBudget 1──* BudgetLine
FinancialPeriod 1──* Expense
ExpenseCategory 1──* BudgetLine, Expense, RecurringExpense
```

## Índices (configurados en EF)

- Unicidad período: (HouseholdId, Year, Month).
- Unicidad idempotencia gastos: IdempotencyKey.
- FKs con delete restrict donde aplica.

## Migraciones

No incluidas en repositorio. Generar con EF Core una vez configurada la cadena SQL (ver `Documentation/EnvironmentVariables.md`).
