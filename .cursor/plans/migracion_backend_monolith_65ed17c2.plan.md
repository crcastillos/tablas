---
name: Migracion Backend Monolith
overview: Migrar completamente el backend desde .NET a `monolith-next` con Node + `mssql`, conservando el contrato HTTP actual para que el frontend no requiera cambios y realizando un corte total para eliminar el proxy legado.
todos:
  - id: foundation-node-api
    content: Crear capa base HTTP/errores/auth config en monolith-next para reemplazar comportamiento transversal de .NET
    status: completed
  - id: auth-jwt-native
    content: Implementar auth nativa en Next con JWT, hash de password, endpoint me y rate limit de login
    status: completed
  - id: households-periods-access
    content: Portar households/members/periods y reglas de autorización por hogar
    status: completed
  - id: financial-modules-sql
    content: Migrar incomes, categories, recurring, budget, expenses y reportes con repositorios mssql
    status: completed
  - id: cutover-remove-legacy-proxy
    content: Eliminar proxy legado, remover LEGACY_API_BASE_URL y dejar backend 100% Next.js
    status: completed
  - id: validate-netlify-readiness
    content: Ejecutar validación funcional completa y documentar despliegue Netlify sin dependencia .NET
    status: completed
isProject: false
---

# Migración total backend a monolith-next

## Objetivo
Reemplazar `src/HouseholdFinance.Api` por rutas nativas en `monolith-next/src/app/api`, mantener SQL Server actual (`DefaultConnection`) y retirar toda dependencia de `LEGACY_API_BASE_URL` y del proxy a .NET.

## Estado actual verificado
- `monolith-next` hoy funciona como proxy en [`monolith-next/src/app/api/[...path]/route.ts`](G:/Proyectos_cursor/tablas/monolith-next/src/app/api/[...path]/route.ts).
- El proxy usa [`monolith-next/src/lib/http/proxyLegacy.ts`](G:/Proyectos_cursor/tablas/monolith-next/src/lib/http/proxyLegacy.ts) y [`monolith-next/src/lib/config/legacyApi.ts`](G:/Proyectos_cursor/tablas/monolith-next/src/lib/config/legacyApi.ts).
- SQL Server está preparado pero sin uso efectivo de negocio en [`monolith-next/src/lib/sql/sqlServer.ts`](G:/Proyectos_cursor/tablas/monolith-next/src/lib/sql/sqlServer.ts).
- Contrato a preservar: `ApiResponse<T>`, rutas `/api/auth`, `/api/households`, `/api/income-types`, etc. (hoy consumidas desde `src/frontend/api/*`).

## Arquitectura objetivo
```mermaid
flowchart TD
client[Frontend Next] --> apiRoutes[Next Route Handlers /api/*]
apiRoutes --> httpLayer[apiResponse + errorMapper + authGuards]
httpLayer --> services[Domain Services]
services --> repos[Repositories SQL Server mssql]
repos --> sql[(SQL Server DefaultConnection)]
```

## Plan de ejecución
1. **Fundación backend Node en monolith-next**
   - Crear capa HTTP común (`ApiResponse`, mapping de errores de negocio, correlación).
   - Definir errores tipados equivalentes a .NET: 400/401/403/404/409/500.
   - Consolidar configuración JWT/DB en `src/lib/config`.

2. **Autenticación y sesión JWT nativas**
   - Implementar `/api/auth/register`, `/api/auth/login`, `/api/auth/me`, `/api/auth/logout` en Next.
   - Implementar hash/verificación de contraseña y lockout equivalente funcional.
   - Añadir rate limit para login (paridad funcional con política actual).

3. **Autorización de hogar y guardas transversales**
   - Portar reglas de `RequireMembership`, `RequireOwner`, `RequireManageMembers`, `RequireManagePeriods`.
   - Crear middleware/utilidades reutilizables para validar acceso por `householdId` en rutas.

4. **Migración de módulos de dominio (rutas + servicios + repositorios SQL)**
   - Households + members.
   - Periods (crear, cerrar, reabrir).
   - Income-types + incomes.
   - Categories + recurring expenses.
   - Budget (incluyendo concurrencia/validaciones y generate-from-recurring).
   - Expenses (filtros, paginación, estados, validaciones).
   - Reports/dashboard (consultas agregadas).

5. **Compatibilidad de contrato con frontend existente**
   - Mantener exactamente rutas, shapes de DTO y envelope `ApiResponse<T>` esperados por `src/frontend/api/*`.
   - Verificar respuestas de error y códigos HTTP en casos de negocio.

6. **Cutover total (sin .NET)**
   - Eliminar catch-all proxy `[...path]` y `proxyLegacy`.
   - Remover `LEGACY_API_BASE_URL` de configuración y documentación.
   - Mantener `/api/health` con chequeo real de DB + JWT runtime.

7. **Validación final y checklist de despliegue Netlify**
   - Pruebas funcionales por módulo (login, hogar/periodo, ingresos, presupuesto, gastos, reportes).
   - Build/typecheck y smoke de endpoints críticos.
   - Actualizar README con variables finales y pasos de despliegue sin dependencia .NET.

## Archivos clave a intervenir
- API routes: [`monolith-next/src/app/api`](G:/Proyectos_cursor/tablas/monolith-next/src/app/api)
- Capa HTTP/auth: [`monolith-next/src/lib/http`](G:/Proyectos_cursor/tablas/monolith-next/src/lib/http), [`monolith-next/src/lib/config/env.ts`](G:/Proyectos_cursor/tablas/monolith-next/src/lib/config/env.ts)
- SQL layer: [`monolith-next/src/lib/sql/sqlServer.ts`](G:/Proyectos_cursor/tablas/monolith-next/src/lib/sql/sqlServer.ts)
- Cliente frontend a preservar: [`monolith-next/src/frontend/api`](G:/Proyectos_cursor/tablas/monolith-next/src/frontend/api)
- Elementos a retirar al corte: [`monolith-next/src/lib/http/proxyLegacy.ts`](G:/Proyectos_cursor/tablas/monolith-next/src/lib/http/proxyLegacy.ts), [`monolith-next/src/lib/config/legacyApi.ts`](G:/Proyectos_cursor/tablas/monolith-next/src/lib/config/legacyApi.ts), [`monolith-next/src/app/api/[...path]/route.ts`](G:/Proyectos_cursor/tablas/monolith-next/src/app/api/[...path]/route.ts)

## Riesgos a controlar
- Paridad exacta de reglas de negocio (periodos cerrados, ownership, conflictos 409).
- Compatibilidad JWT para no romper sesiones/guardas de frontend.
- Complejidad SQL en reportes y presupuesto (agregaciones y validaciones).
- Evitar regresiones al cortar el proxy en una sola fase (big bang).