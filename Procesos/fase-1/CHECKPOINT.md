# Resultado de la fase 1

## 1. Análisis
Fase 1 estabilizada sobre el backend existente (.NET 8 API, Identity, JWT, hogares, períodos, auditoría) y frontend React+TS+MUI implementado desde plantilla Vite. Se corrigieron tests de integración (aislamiento de HttpClient) y warnings CS9113 en servicios.

## 2. Decisiones técnicas
- Base de datos de pruebas: EF Core InMemory con `TestingDbName` único por factory.
- JWT en Testing: clave fija inyectada vía `PostConfigure`.
- Frontend desacoplado con proxy Vite `/api` → `http://localhost:5263`.
- Token en `localStorage` documentado; autorización real en API.

## 3. Reglas de negocio implementadas
- Registro/login con Identity y política de contraseñas.
- Creador de hogar = propietario con permisos de miembros y períodos.
- Un período único por hogar/año/mes (409 Conflict).
- Período cerrado = solo lectura; reapertura auditada.
- Pertenencia al hogar validada en servicios.

## 4. Archivos creados
- `frontend/src/**` (auth, context, api, pages fase 1, layout, routes)
- `tests/HouseholdFinance.IntegrationTests/IntegrationCollection.cs`
- `tests/HouseholdFinance.IntegrationTests/xunit.runner.json`
- `frontend/.env.example`

## 5. Archivos modificados
- `tests/HouseholdFinance.IntegrationTests/AuthIntegrationTests.cs`
- `src/HouseholdFinance.Api/Services/CategoryService.cs` (auditoría)
- `src/HouseholdFinance.Api/Services/ExpenseService.cs` (auditoría cancelación)

## 6. Base de datos
Entidades Fase 1: `ApplicationUser`, `Household`, `HouseholdMember`, `FinancialPeriod`, `AuditLog`, catálogo `IncomeType` (seed). Índice único `HouseholdId+Year+Month`. Migración EF pendiente de ejecutar en entorno con `dotnet-ef` compatible (.NET 8); usar `dotnet ef migrations add InitialCreate` + `database update` con `ConnectionStrings__DefaultConnection` parametrizada.

## 7. API
| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| POST | /api/auth/register | Anónimo | Registro |
| POST | /api/auth/login | Anónimo | Login JWT |
| GET | /api/auth/me | Auth | Perfil |
| POST | /api/auth/logout | Auth | Cierre sesión |
| GET/POST | /api/households | Auth | Listar/crear hogar |
| GET/PUT | /api/households/{id} | Miembro | Consultar/actualizar |
| * | /api/households/{id}/members | Owner/gestor | CRUD integrantes |
| * | /api/households/{id}/periods | Miembro/gestor | CRUD períodos, close/reopen |

## 8. Frontend
Rutas: `/login`, `/register`, `/`, `/periods`, `/settings`, `/members`. Componentes: `MainLayout`, estados carga/error/vacío, selectores hogar/período.

## 9. Seguridad
JWT Bearer, rate limit login, CORS restringido, middleware global, validación pertenencia, auditoría operaciones críticas, sin secretos en repo.

## 10. Pruebas y validaciones
- [x] dotnet restore
- [x] dotnet build -c Release (0 warnings)
- [x] dotnet test -c Release (6/6 OK)
- [x] migraciones revisadas (pendiente generación EF por incompatibilidad dotnet-ef/SDK local)
- [x] npm run lint (solo warnings hooks)
- [x] npm run build
- [x] responsividad base (drawer móvil)
- [x] accesibilidad base (labels, aria en acciones)
- [x] integración API (AuthIntegrationTests)

## 11. Ejecución
```powershell
# Backend
$env:ConnectionStrings__DefaultConnection="Server=localhost;Database=HouseholdFinance;Trusted_Connection=True;TrustServerCertificate=True"
$env:JwtSettings__Key="CHANGE_ME_USE_AT_LEAST_32_CHARACTERS_SECRET"
dotnet run --project src/HouseholdFinance.Api

# Frontend
cd frontend
npm install
npm run dev
```

## 12. Pendientes o riesgos
- Cadena SQL real debe proveerse vía `ConnectionStrings__DefaultConnection` en cada ambiente.
- Token en localStorage: mitigar XSS en despliegue.
- Ejecutar `dotnet ef database update` contra SQL Server antes de producción.
