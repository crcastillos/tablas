# Guía de despliegue

## Prerrequisitos

- .NET 8 SDK / Runtime
- SQL Server 2019+
- Node.js 20+ (solo build frontend)
- IIS o reverse proxy (nginx) opcional

## 1. Base de datos

1. Crear base de datos `HouseholdFinance` en SQL Server.
2. Configurar `ConnectionStrings__DefaultConnection`.
3. Ejecutar migración EF (ver EnvironmentVariables.md).

## 2. Backend

```powershell
cd src/HouseholdFinance.Api
dotnet publish -c Release -o ./publish
```

Variables en el host (IIS Application Settings o systemd):

- `ConnectionStrings__DefaultConnection`
- `JwtSettings__*`
- `CorsSettings__AllowedOrigins__*`
- `ASPNETCORE_ENVIRONMENT=Production`

Ejecutar:

```powershell
dotnet HouseholdFinance.Api.dll
```

Health check: `GET /health`.

## 3. Frontend

```powershell
cd frontend
$env:VITE_API_BASE_URL="https://api.tudominio.com"
npm ci
npm run build
```

Publicar contenido de `frontend/dist/` en servidor estático o IIS como SPA.

### Fallback SPA

Configurar rewrite para que rutas desconocidas sirvan `index.html`.

## 4. CORS

Origen del frontend debe estar en `CorsSettings__AllowedOrigins`.

## 5. HTTPS

Terminar TLS en reverse proxy o IIS; forzar HTTPS en producción.

## 6. Rollback

- Backend: desplegar paquete anterior + revertir migración EF si aplica (`dotnet ef database update PreviousMigration`).
- Frontend: restaurar `dist` anterior.
- Base de datos: backup previo a cada release.

## 7. Verificación post-despliegue

- [ ] `/health` responde OK
- [ ] Login/registro funcional
- [ ] Crear hogar y período
- [ ] Swagger deshabilitado o protegido en producción
