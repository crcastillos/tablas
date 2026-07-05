# Finanzas del Hogar

Aplicación web SPA + API REST para control de ingresos, gastos y presupuesto familiar mensual.

## Stack

- **Backend:** .NET 8, ASP.NET Core Web API, EF Core, SQL Server, Identity + JWT
- **Frontend:** React 19, TypeScript, Vite 8, Material UI 9
- **Moneda:** USD · **Zona horaria:** America/El_Salvador

## Estructura

```text
src/HouseholdFinance.Api/     API backend
tests/                        Pruebas unitarias e integración
frontend/                     SPA React
Documentation/                Documentación técnica
Procesos/fase-1..4/           Checkpoints por fase
```

## Inicio rápido

### 1. Configurar variables

**Piloto (MyAspnet):** la configuración está en `src/HouseholdFinance.Api/appsettings.json` y `appsettings.Production.json`. No requiere variables de entorno en el hosting.

Para desarrollo local opcional, copiar `.env.example` a `.env` en la raíz.

### 2. Migración de base de datos

```powershell
dotnet tool restore
$env:ConnectionStrings__DefaultConnection="Server=localhost;Database=HouseholdFinance;Trusted_Connection=True;TrustServerCertificate=True"
$env:JwtSettings__Key="clave-secreta-de-al-menos-32-caracteres"
dotnet ef migrations add InitialCreate --project src/HouseholdFinance.Api
dotnet ef database update --project src/HouseholdFinance.Api
```

> **Nota:** el repo fija `dotnet-ef` 8.0.11 en `.config/dotnet-tools.json`. Si tienes instalado globalmente `dotnet-ef` 10.x, usa siempre `dotnet tool restore` antes de migrar para evitar el error `System.Runtime, Version=10.0.0.0`.

Si una migración falló a medias (por ejemplo error 1785 de cascada o tablas ya existentes), elimina la base y vuelve a aplicar:

```powershell
dotnet ef database drop --force --project src/HouseholdFinance.Api
dotnet ef database update --project src/HouseholdFinance.Api
```

### Credenciales demo

- Usuario: `demo@finanzashogar.local`
- Username: `demo.finanzas`
- Clave: `DemoFinanzas2026`

Estas credenciales son para datos de demostración local únicamente.

### 3. Backend

```powershell
cd src/HouseholdFinance.Api
dotnet run
```

API: `http://localhost:5080` · Swagger en Development.

Si `dotnet run` falla con `MSB3027` / archivo bloqueado por `HouseholdFinance.Api`, hay otra instancia en ejecución. Detén el proceso y vuelve a compilar:

```powershell
Get-Process HouseholdFinance.Api -ErrorAction SilentlyContinue | Stop-Process -Force
dotnet build
dotnet run
```

### 4. Frontend

```powershell
cd frontend
copy .env.example .env
npm install
npm run dev
```

SPA: `http://localhost:5173`

## Publicación API (MyAspnet / IIS)

Ver [Documentation/MyAspnetDeploy.md](Documentation/MyAspnetDeploy.md).

Perfil Visual Studio: **MyAspnet-WebDeploy** en `HouseholdFinance.Api`.

Configuración piloto embebida en `appsettings.json` / `appsettings.Production.json` (sin variables de entorno en el panel).

Verificación: `https://tablas.innovasal.app/health`

## Validación

```powershell
dotnet build -c Release
dotnet test -c Release
cd frontend && npm run lint && npm run build
```

## Documentación

Ver carpeta `Documentation/` y checkpoints en `Procesos/fase-1` … `fase-4`.

## Licencia

Proyecto privado — uso interno.
