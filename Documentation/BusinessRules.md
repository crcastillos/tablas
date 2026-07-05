# Reglas de negocio

## Hogar y membresía

- Cada recurso financiero pertenece a un `Household`.
- Solo miembros activos acceden a datos del hogar.
- Owner puede gestionar miembros y períodos (según flags).

## Períodos mensuales

- Un período por hogar por año/mes (sin duplicados).
- Estados: Draft, Open, Closed.
- Período **Closed** bloquea altas/ediciones de ingresos, presupuesto y gastos.
- Cierre y reapertura generan entrada en `AuditLog`.

## Ingresos

- Estados: Pending, Received, Cancelled.
- `estimatedAmount` planificado; `receivedAmount` al marcar recibido.
- Tipos de ingreso desde catálogo (`IncomeType`).

## Categorías

- Tipos: Fixed, Variable, Savings, Debt.
- Predeterminadas al crear hogar; personalizadas sin duplicar nombre.
- Desactivación lógica (`isActive = false`).

## Gastos recurrentes

- Monto estimado, día de pago, frecuencia.
- Opción `autoGenerateInBudget` para presupuesto.

## Presupuesto

- Una cabecera `MonthlyBudget` por período.
- Líneas por categoría con montos presupuestados.
- Generación desde recurrentes es **idempotente** (no duplica líneas existentes).
- Advertencia si presupuesto total > ingreso estimado.
- Concurrencia optimista (`RowVersion`).

## Gastos

- Estados: Pending, Confirmed, Cancelled.
- Confirmados incrementan `spentAmount`; pendientes en `committedAmount`.
- Anulación no borra registro; deja de afectar totales.
- `Idempotency-Key` obligatorio en creación para evitar duplicados.

## Cálculos (autoritativos en backend)

- Saldo estimado = ingreso estimado − gastos confirmados.
- Saldo real = ingreso recibido − gastos confirmados.
- Utilización presupuesto = gastos confirmados / presupuesto total (si > 0).
- Por categoría: disponible = presupuestado − gastado − comprometido.

## Zona horaria y moneda

- Moneda inicial: USD.
- Zona horaria referencia: America/El_Salvador.
