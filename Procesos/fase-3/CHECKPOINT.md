# Resultado de la fase 3

## 1. Análisis
Backend de gastos completo (estados, filtros paginados, idempotencia, impacto presupuesto). Frontend con registro rápido, listado, advertencias no presupuestado/excedido y manejo período cerrado.

## 2. Decisiones técnicas
- Gastos confirmados al crear (MVP); pendientes vía flujo confirm.
- `IdempotencyKey` en cliente para evitar doble envío.
- Validación presupuesto en servicio con flags `ConfirmUnbudgeted` / `ConfirmExceeded`.
- Tarjeta de crédito: gasto al momento de compra (documentado en BusinessRules).

## 3. Reglas de negocio implementadas
- Monto > 0; categoría activa; fecha dentro del período.
- Anulación con motivo y auditoría.
- Período cerrado inmutable.
- Paginación y filtros en listados.

## 4. Archivos creados
- `frontend/src/pages/expenses/ExpensesPage.tsx`
- `frontend/src/api/expenses.api.ts`

## 5. Archivos modificados
- `src/HouseholdFinance.Api/Services/ExpenseService.cs` (auditoría anulación)

## 6. Base de datos
Entidad `Expense` con índices por hogar, período, categoría, estado; FK opcional a `RecurringExpense`.

## 7. API
| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| GET | .../periods/{id}/expenses | Miembro | Listado paginado/filtros |
| POST | .../periods/{id}/expenses | Miembro | Crear gasto |
| GET/PUT | .../expenses/{id} | Miembro | Detalle/edición |
| POST | .../expenses/{id}/confirm | Miembro | Confirmar pendiente |
| POST | .../expenses/{id}/cancel | Miembro | Anular con motivo |

## 8. Frontend
Acción rápida desde toolbar (+), formulario móvil, tabla movimientos, confirmaciones de conflicto presupuestario.

## 9. Seguridad
Autorización por membresía; no confiar en flags de confirmación sin revalidación backend.

## 10. Pruebas y validaciones
- [x] dotnet test (calculadora gastos confirmados)
- [x] npm run lint/build

## 11. Ejecución
Registrar gasto desde `/expenses?quick=1` o botón + en barra superior.

## 12. Pendientes o riesgos
- Edición inline limitada; detalle completo en iteración posterior.
- Filtros avanzados en UI (backend ya soporta query params).
