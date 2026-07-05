# API Endpoints

Base URL: configurada en frontend (`VITE_API_BASE_URL`). Prefijo: `/api`.

## Auth

| Método | Ruta | Auth |
|---|---|---|
| POST | `/auth/register` | No |
| POST | `/auth/login` | No |
| POST | `/auth/logout` | Sí |
| GET | `/auth/me` | Sí |

## Hogares

| Método | Ruta |
|---|---|
| GET/POST | `/households` |
| GET/PUT | `/households/{householdId}` |
| GET/POST | `/households/{householdId}/members` |

## Períodos

| Método | Ruta |
|---|---|
| GET/POST | `/households/{householdId}/periods` |
| GET | `/households/{householdId}/periods/{periodId}` |
| POST | `/households/{householdId}/periods/{periodId}/close` |
| POST | `/households/{householdId}/periods/{periodId}/reopen` |

## Ingresos

| Método | Ruta |
|---|---|
| GET | `/income-types` |
| GET/POST | `/households/{householdId}/periods/{periodId}/incomes` |
| POST | `/households/{householdId}/incomes/{incomeId}/receive` |
| POST | `/households/{householdId}/incomes/{incomeId}/cancel` |

## Categorías y recurrentes

| Método | Ruta |
|---|---|
| GET/POST | `/households/{householdId}/expense-categories` |
| POST | `/households/{householdId}/expense-categories/{categoryId}/deactivate` |
| GET/POST | `/households/{householdId}/recurring-expenses` |
| POST | `/households/{householdId}/recurring-expenses/{id}/deactivate` |

## Presupuesto

| Método | Ruta |
|---|---|
| GET/POST | `/households/{householdId}/periods/{periodId}/budget` |
| POST | `/households/{householdId}/periods/{periodId}/budget/generate-from-recurring` |

## Gastos

| Método | Ruta |
|---|---|
| GET | `/households/{householdId}/periods/{periodId}/expenses` |
| POST | `/households/{householdId}/periods/{periodId}/expenses` |
| GET/PUT | `/households/{householdId}/expenses/{expenseId}` |
| POST | `/households/{householdId}/expenses/{expenseId}/confirm` |
| POST | `/households/{householdId}/expenses/{expenseId}/cancel` |

## Dashboard y reportes

| Método | Ruta |
|---|---|
| GET | `/households/{householdId}/periods/{periodId}/dashboard` |
| GET | `/households/{householdId}/periods/{periodId}/reports/budget-vs-actual` |
| GET | `/households/{householdId}/periods/{periodId}/reports/by-category` |
| GET | `/households/{householdId}/periods/{periodId}/reports/cash-flow` |
| GET | `/households/{householdId}/reports/monthly-comparison` |

## Sistema

| Método | Ruta |
|---|---|
| GET | `/health` |

Respuestas envueltas en `ApiResponse<T>` con `success`, `data`, `message`, `errors`.

Swagger: disponible en entorno Development (`/swagger`).
