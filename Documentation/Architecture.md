# Arquitectura — Finanzas del Hogar

## Visión general

```text
Usuario → SPA React (Vite) → HTTPS → ASP.NET Core 8 Web API → EF Core → SQL Server
```

## Backend (monolito modular)

| Capa | Responsabilidad |
|---|---|
| Controllers | HTTP, autorización, validación de entrada |
| Services | Reglas de negocio, cálculos, auditoría |
| Data | `ApplicationDbContext`, configuraciones EF |
| Models / DTOs | Entidades de dominio y contratos API |

Flujo: `HTTP → Controller → Service → DbContext → SQL Server`

Servicios principales: `AuthService`, `HouseholdService`, `PeriodService`, `IncomeService`, `CategoryService`, `BudgetService`, `ExpenseService`, `DashboardService`, `ReportService`, `AuditService`, `FinancialCalculator`.

## Frontend (SPA por dominios)

```text
Página → Componentes UI → Context (Auth/App) → api/*.ts → Axios → API REST
```

Estructura: `pages/` por dominio, `api/` clientes HTTP, `context/` estado global, `utils/` helpers.

## Autenticación

JWT Bearer emitido en login; almacenado en cliente; enviado en header `Authorization`. Identity para usuarios y contraseñas.

## Entornos

| Entorno | Base de datos |
|---|---|
| Development / Production | SQL Server (cadena parametrizada) |
| Testing | EF InMemory (pruebas) |

## Middleware

- `ExceptionHandlingMiddleware` — respuestas JSON uniformes.
- `CorrelationIdMiddleware` — trazabilidad de solicitudes.

## Health

`GET /health` — disponibilidad de la API.
