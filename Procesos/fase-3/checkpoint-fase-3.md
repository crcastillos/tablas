# Checkpoint — Fase 3: Gastos, pagos y control operativo mensual

**Fecha:** 2026-07-04  
**Estado:** Completada

## Objetivo cumplido

Registro de egresos reales con estados, idempotencia, filtros paginados e impacto en presupuesto y totales del período.

## Entidades y estados

| Entidad | Estados |
|---|---|
| Expense | Pending, Confirmed, Cancelled |

Tipos de movimiento: Purchase, ServicePayment, DebtPayment, SavingsTransfer, Withdrawal, Adjustment, Other.  
Métodos de pago: Cash, DebitCard, CreditCard, BankTransfer, EWallet, Check, Other.

## Endpoints

| Método | Ruta |
|---|---|
| GET | `/api/households/{id}/periods/{periodId}/expenses` (paginado, filtros) |
| POST | `/api/households/{id}/periods/{periodId}/expenses` |
| GET/PUT | `/api/households/{id}/expenses/{expenseId}` |
| POST | `/api/households/{id}/expenses/{expenseId}/confirm`, `/cancel` |

## Reglas implementadas

- Header `Idempotency-Key` evita doble registro por reintentos/doble clic.
- Gastos confirmados actualizan `spentAmount` en `BudgetLine`.
- Gastos pendientes reflejan compromiso (`committedAmount`).
- Anulación con motivo; no elimina físicamente.
- Período cerrado rechaza altas/ediciones.
- Validación de categoría activa y pertenencia al hogar.
- Advertencias: categoría sin presupuesto, exceso presupuestario (frontend confirma).

## DTOs principales

- `CreateExpenseRequest`, `UpdateExpenseRequest`, `ExpenseResponse`
- `ExpenseListQuery`: pageNumber, pageSize, status, categoryId, search, sort

## Fórmulas actualizadas (período)

- `confirmedExpenses`, `pendingExpenses` agregados en dashboard y presupuesto.
- `realCashBalance` = ingreso recibido − gastos confirmados.

## Frontend

- `ExpensesPage`: registro rápido (`?quick=1`), formulario completo, listado paginado.
- Advertencias de presupuesto antes de confirmar.
- Solo lectura en período cerrado.

## Pruebas

- Unit tests de calculadora cubren impacto de montos.
- Autorización vía JWT en integración.

## Gates ejecutados

```text
dotnet build -c Release    → OK
dotnet test -c Release     → OK
npm run lint               → OK
npm run build              → OK
```

## Casos borde documentados

- Idempotency-Key duplicado → respuesta idempotente (mismo recurso).
- Tarjeta de crédito registrada como método; no doble contabilización en ingreso (egreso único).
- Edición concurrente: RowVersion en presupuesto; gastos con validación de estado.

## Limitaciones conocidas

- Paginación frontend fija a 50 ítems (mejorable con UI de páginas).
- Pruebas de integración de gastos no exhaustivas (solo flujo base auth).

## Validación manual sugerida

1. Registrar gasto pendiente → confirmar → ver total en presupuesto.
2. Intentar segundo POST con mismo Idempotency-Key → sin duplicado.
3. Anular gasto confirmado → totales revertidos.
4. Período cerrado → UI deshabilitada y API 409/400.
