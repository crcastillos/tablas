# Checkpoint — Fase 1: Base técnica, seguridad, hogares y períodos

**Fecha:** 2026-07-04  
**Estado:** Completada  
**Proyecto:** Finanzas del Hogar

## Análisis

Se levantó la solución greenfield con API .NET 8, pruebas xUnit y SPA React+TypeScript (Vite). Se implementó autenticación JWT, gestión de hogares/miembros y flujo de períodos mensuales con auditoría y validación de pertenencia.

## Decisiones técnicas

- Monolito modular en capas: Controllers → Services → ApplicationDbContext.
- ASP.NET Core Identity + JWT Bearer; contraseñas con política mínima (8 chars, mayúscula, minúscula, dígito).
- Cadena SQL **no hardcodeada**: `ConnectionStrings__DefaultConnection` vía variables de entorno / `.env`.
- Entorno `Testing` usa InMemory DB y JWT de prueba para integración automatizada.
- DTOs de auth/hogares/períodos como **clases** (no records) por compatibilidad con validación ASP.NET Core.
- Frontend desacoplado con Axios, contextos `AuthContext` y `AppContext`, Material UI 9 con props `sx` (breaking change vs system props).
- Rate limiting en login; middleware global de excepciones y correlation id.

## Reglas de negocio implementadas

- Usuario autenticado puede crear hogares y ser Owner.
- Solo miembros activos del hogar acceden a recursos del hogar.
- Período mensual único por hogar (año + mes).
- Período cerrado bloquea modificaciones financieras (base para fases 2–4).
- Cierre y reapertura de período auditados en `AuditLog`.
- Roles: Owner y Member con flags `canManageMembers` / `canManagePeriods`.

## Archivos creados / modificados (principales)

### Backend
- `HouseholdFinance.sln`, `src/HouseholdFinance.Api/`
- `Program.cs`, `Data/ApplicationDbContext.cs`, `Data/Configurations/EntityConfigurations.cs`
- `Models/ApplicationUser.cs`, `Household.cs`, `FinancialPeriod.cs`, `AuditLog.cs`
- `Services/AuthService.cs`, `HouseholdService.cs`, `PeriodService.cs`, `AuditService.cs`, `CoreServices.cs`
- `Controllers/AuthController.cs`, `HouseholdsController.cs`, `PeriodsController.cs`
- `Middleware/ExceptionHandlingMiddleware.cs`, `CorrelationIdMiddleware.cs`
- `DTOs/Auth/`, `DTOs/Households/`, `DTOs/Periods/`
- `tests/HouseholdFinance.UnitTests/`, `tests/HouseholdFinance.IntegrationTests/`

### Frontend
- `frontend/` (Vite + React 19 + MUI 9)
- `src/context/AuthContext.tsx`, `AppContext.tsx`
- `src/pages/auth/`, `settings/`, `periods/`, `settings/MembersPage.tsx`
- `src/api/auth.api.ts`, `households.api.ts`, `axiosClient.ts`
- `src/layouts/MainLayout.tsx`, `src/routes/AppRoutes.tsx`

### Configuración
- `.env.example`, `src/HouseholdFinance.Api/appsettings.json` (conexión vacía)

## Modelo de datos (Fase 1)

| Entidad | Descripción |
|---|---|
| ApplicationUser | Identity extendido (DisplayName) |
| Household | Hogar con moneda USD y TZ America/El_Salvador |
| HouseholdMember | Relación usuario-hogar con rol y permisos |
| FinancialPeriod | Período mensual (Draft/Open/Closed) |
| AuditLog | Trazabilidad de acciones sensibles |

## Migración

**Pendiente de aplicar** hasta que el usuario provea `ConnectionStrings__DefaultConnection`:

```powershell
cd G:/Proyectos_cursor/tablas
$env:ConnectionStrings__DefaultConnection="Server=...;Database=HouseholdFinance;..."
dotnet ef migrations add InitialCreate --project src/HouseholdFinance.Api
dotnet ef database update --project src/HouseholdFinance.Api
```

El modelo EF incluye entidades de fases 2–4 en el mismo contexto; la migración inicial creará el esquema completo.

## Endpoints (Fase 1)

| Método | Ruta |
|---|---|
| POST | `/api/auth/register`, `/api/auth/login`, `/api/auth/logout` |
| GET | `/api/auth/me` |
| GET/POST | `/api/households` |
| GET/PUT | `/api/households/{id}` |
| GET/POST | `/api/households/{id}/members` |
| GET/POST | `/api/households/{id}/periods` |
| GET | `/api/households/{id}/periods/{periodId}` |
| POST | `/api/households/{id}/periods/{periodId}/close`, `/reopen` |
| GET | `/health` |

## Frontend (Fase 1)

- Login / registro con JWT en localStorage.
- Configuración: crear y seleccionar hogar.
- Integrantes del hogar (Owner).
- Períodos: crear, listar, cerrar, reabrir.
- Layout principal con navegación y guards de autenticación.

## Seguridad

- JWT con validación issuer/audience/lifetime.
- `[Authorize]` en controladores de dominio.
- Validación de pertenencia al hogar en servicios.
- CORS configurable vía `CorsSettings__AllowedOrigins`.
- Sin secretos en repositorio; validación al arranque.

## Pruebas ejecutadas

```text
dotnet restore                          → OK
dotnet build -c Release                 → OK (0 errores)
dotnet test -c Release                  → OK (4 unit + 2 integration)
npm run lint (frontend)                 → OK (solo warnings)
npm run build (frontend)                → OK
```

Pruebas de integración: registro, login, creación de hogar y período.

## Instrucciones de ejecución

```powershell
# Backend
copy .env.example .env   # editar ConnectionStrings__DefaultConnection y JwtSettings__Key
cd src/HouseholdFinance.Api
dotnet run

# Frontend
cd frontend
copy .env.example .env   # VITE_API_BASE_URL=http://localhost:5080
npm install
npm run dev
```

## Riesgos y pendientes

- Migración EF pendiente hasta cadena SQL del usuario.
- Swagger disponible en Development; requiere JWT manual para pruebas autenticadas.
- Warnings de lint (react-hooks/exhaustive-deps) — no bloquean build.
