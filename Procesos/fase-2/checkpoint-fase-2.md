# Checkpoint — Fase 2: Ingresos, categorías, recurrentes y presupuesto

**Fecha:** 2026-07-04  
**Estado:** Completada

## Objetivo cumplido

Planificación mensual: ingresos estimados/recibidos, categorías de gasto, obligaciones recurrentes y presupuesto por categoría con cálculos autoritativos en backend.

## Decisiones técnicas

- `FinancialCalculator` centraliza fórmulas (ingreso, presupuesto, saldo, porcentaje asignado).
- Generación idempotente de líneas presupuestarias desde recurrentes (`generate-from-recurring`).
- Concurrencia optimista en `MonthlyBudget` vía `RowVersion`.
- Categorías predeterminadas sembradas al crear hogar (`DataSeedService`).
- Advertencia `exceedsIncome` cuando presupuesto supera ingreso estimado.

## Relaciones agregadas

```text
Household
  ├── ExpenseCategory (1:N)
  ├── RecurringExpense (1:N) → ExpenseCategory
  └── FinancialPeriod
        ├── Income (N) → IncomeType
        └── MonthlyBudget (0..1)
              └── BudgetLine (N) → ExpenseCategory
```

## Endpoints nuevos

| Método | Ruta |
|---|---|
| GET | `/api/income-types` |
| GET/POST | `/api/households/{id}/periods/{periodId}/incomes` |
| POST | `/api/households/{id}/incomes/{incomeId}/receive`, `/cancel` |
| GET/POST | `/api/households/{id}/expense-categories` |
| POST | `/api/households/{id}/expense-categories/{categoryId}/deactivate` |
| GET/POST | `/api/households/{id}/recurring-expenses` |
| POST | `/api/households/{id}/recurring-expenses/{id}/deactivate` |
| GET/POST | `/api/households/{id}/periods/{periodId}/budget` |
| POST | `/api/households/{id}/periods/{periodId}/budget/generate-from-recurring` |

## Cálculos implementados

- `totalEstimatedIncome`, `totalReceivedIncome`
- `totalBudgeted`, `assignedPercentage`
- `estimatedCashBalance` = ingreso estimado − gastos confirmados (base fase 3)
- `budgetBalance` = ingreso estimado − presupuesto total
- Por línea: `availableAmount`, `consumedPercentage`

## Reglas de negocio

- Ingreso: estados Pending → Received / Cancelled.
- Categorías: tipos Fixed, Variable, Savings, Debt; desactivación lógica.
- Recurrentes: frecuencia mensual/trimestral/anual; día de pago esperado.
- Presupuesto bloqueado si período Closed.
- Confirmación explícita si presupuesto excede ingreso (`exceedsIncomeConfirmed`).

## Frontend

- `IncomesPage`: CRUD ingresos, marcar recibido.
- `CategoriesPage`: listado y alta de categorías.
- `RecurringPage`: gastos fijos/recurrentes.
- `BudgetPage`: asistente presupuesto, generación desde recurrentes, indicadores y advertencias.

## Pruebas

- `FinancialCalculatorTests` (unit): fórmulas de presupuesto e ingreso.
- Integración hereda flujo auth + hogar + período.

## Gates ejecutados

```text
dotnet build -c Release    → OK
dotnet test -c Release     → OK
npm run lint               → OK (warnings)
npm run build              → OK
```

## Flujos validados (textual)

1. Crear hogar → categorías predeterminadas disponibles.
2. Abrir período → registrar ingreso estimado → marcar recibido.
3. Crear recurrente → generar presupuesto desde recurrentes (sin duplicar líneas).
4. Editar montos por categoría → ver totales y advertencia si excede ingreso.
5. Cerrar período → presupuesto en solo lectura.

## Pendientes

- Migración SQL (misma que Fase 1).
- Pruebas de integración específicas de presupuesto (ampliar cobertura en iteración futura).
