# Variables de entorno

## Backend (.NET)

Copiar `.env.example` a `.env` o configurar en el sistema / IIS.

| Variable | Requerida | Descripción |
|---|---|---|
| `ConnectionStrings__DefaultConnection` | **Sí** (prod/dev) | Cadena SQL Server. Vacía en `appsettings.json`; el usuario la provee. |
| `JwtSettings__Key` | **Sí** | Secreto JWT (mín. 32 caracteres) |
| `JwtSettings__Issuer` | Sí | Emisor del token |
| `JwtSettings__Audience` | Sí | Audiencia del token |
| `JwtSettings__DurationInMinutes` | No | Duración token (default 60) |
| `CorsSettings__AllowedOrigins__0` | Sí | Origen SPA (ej. `http://localhost:5173`) |
| `ASPNETCORE_ENVIRONMENT` | No | Development / Production |

### Ejemplo

```text
ConnectionStrings__DefaultConnection=Server=localhost;Database=HouseholdFinance;Trusted_Connection=True;TrustServerCertificate=True
JwtSettings__Key=CHANGE_ME_USE_AT_LEAST_32_CHARACTERS_SECRET
JwtSettings__Issuer=HouseholdFinance
JwtSettings__Audience=HouseholdFinanceClient
CorsSettings__AllowedOrigins__0=http://localhost:5173
```

### Migración EF

```powershell
$env:ConnectionStrings__DefaultConnection="Server=...;Database=HouseholdFinance;..."
dotnet ef migrations add InitialCreate --project src/HouseholdFinance.Api
dotnet ef database update --project src/HouseholdFinance.Api
```

## Frontend (Vite)

Archivo `frontend/.env`:

| Variable | Descripción |
|---|---|
| `VITE_API_BASE_URL` | URL base API (ej. `http://localhost:5080`) |

## Testing

En pruebas de integración se usa `ASPNETCORE_ENVIRONMENT=Testing` con InMemory DB; no requiere SQL.

## Seguridad

- No commitear `.env` con secretos reales.
- `appsettings.json` mantiene `DefaultConnection` vacío.
