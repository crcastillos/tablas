# Resultado de la fase 2

## 1. Análisis
Backend Fase 2 ya implementado (ingresos, categorías, recurrentes, presupuesto). Frontend completado con vistas de ingresos, categorías, gastos fijos y asistente de presupuesto con advertencia de exceso.

## 2. Decisiones técnicas
- Cálculos autoritativos en `BudgetService` y `FinancialCalculator`.
- Generación idempotente desde recurrentes vía endpoint dedicado.
- Concurrencia optimista con `RowVersion` en presupuesto.
- Seed de categorías predeterminadas al primer listado por hogar.

## 3. Reglas de negocio implementadas
- Ingresos: pendiente/recibido/anulado; montos > 0.
- Categorías predeterminadas sin duplicar; desactivación lógica.
- Recurrentes activos generan líneas presupuestarias sin duplicar.
- Presupuesto > ingreso estimado requiere confirmación explícita.
- Período cerrado bloquea mutaciones.

## 4. Archivos creados
- `frontend/src/pages/incomes/IncomesPage.tsx`
- `frontend/src/pages/categories/CategoriesPage.tsx`
- `frontend/src/pages/recurring/RecurringPage.tsx`
- `frontend/src/pages/budgets/BudgetPage.tsx`
- `frontend/src/api/incomes.api.ts`, `budgets.api.ts`

## 5. Archivos modificados
- `src/HouseholdFinance.Api/Services/CategoryService.cs` (auditoría CRUD categorías/recurrentes)

## 6. Base de datos
Entidades: `IncomeType`, `Income`, `ExpenseCategory`, `RecurringExpense`, `MonthlyBudget`, `BudgetLine`. Índice único presupuesto por período y línea por categoría.

## 7. API
| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| GET | /api/income-types | Auth | Catálogo tipos ingreso |
| * | .../periods/{id}/incomes | Miembro | CRUD ingresos |
| POST | .../incomes/{id}/receive | Miembro | Marcar recibido |
| POST | .../incomes/{id}/cancel | Miembro | Anular |
| * | .../expense-categories | Owner/miembro | CRUD categorías |
| * | .../recurring-expenses | Owner | CRUD recurrentes |
| * | .../periods/{id}/budget | Owner/miembro | Presupuesto + generate-from-recurring |

## 8. Frontend
Vistas responsivas con formularios accesibles, resumen ingreso estimado/recibido, distribución presupuestaria por categoría, confirmación de exceso.

## 9. Seguridad
Validación pertenencia hogar; owner para categorías/recurrentes; auditoría en cambios relevantes.

## 10. Pruebas y validaciones
- [x] dotnet build/test Release
- [x] npm run lint/build
- [x] Unit tests calculadora financiera

## 11. Ejecución
Flujo manual: registrar ingreso → crear categoría → gasto fijo → generar presupuesto desde recurrentes → guardar presupuesto.

## 12. Pendientes o riesgos
- UI de edición avanzada de ingresos/recurrentes (solo alta básica en MVP).
- Confirmación de exceso depende de mensaje de error del backend.
