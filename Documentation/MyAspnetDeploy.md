# Publicación en MyAspnet (IIS + Web Deploy)

Guía para publicar `HouseholdFinance.Api` desde Visual Studio hacia hosting IIS MyAspnet / Site4Now.

## Requisitos en el hosting

- **ASP.NET Core 8.0** habilitado (Runtime / Hosting Bundle).
- Application Pool: **No Managed Code**.
- SQL Server accesible desde el sitio web.
- Migraciones EF aplicadas en la base de producción.

## Perfil de publicación

En Visual Studio:

1. Clic derecho en **HouseholdFinance.Api** → **Publicar**.
2. Seleccionar perfil **`MyAspnet-WebDeploy`**.
3. Editar conexión con datos del panel MyAspnet:
   - **Servidor:** URL Web Deploy (ej. `https://win8181.site4now.net:8172/msdeploy.axd?site=TU-SITIO`)
   - **Nombre del sitio:** nombre IIS del subsitio
   - **Usuario / contraseña:** credenciales MSDeploy del panel
4. Configuración de publicación:
   - **Configuration:** Release
   - **Target framework:** net8.0
   - **Deployment mode:** Framework-dependent
   - **Target runtime:** Portable

Plantilla de credenciales: `Properties/PublishProfiles/MyAspnet-WebDeploy.pubxml.user.example`

## Variables de entorno (obligatorias)

**Modo piloto:** la configuración está en `appsettings.json` y `appsettings.Production.json`. No configure variables en el panel MyAspnet.

Para producción real, mover secretos a variables de entorno o al panel del hosting.

## Archivos incluidos para IIS

| Archivo | Propósito |
|---|---|
| `web.config` | Módulo AspNetCore, logs stdout, variables de entorno |
| `appsettings.Production.json` | Logging y CORS en producción |
| `logs/` | Carpeta para logs stdout de IIS |

## Publicar

1. **Compilar** en Release.
2. **Publicar** con el perfil MyAspnet-WebDeploy.
3. Verificar: `https://tablas.innovasal.app/health`

## Diagnóstico si falla

Descargue por FTP la carpeta `logs/` del sitio publicado:

| Archivo | Qué contiene |
|---|---|
| `logs/deployment-latest.log` | Arranque, seed, health, errores |
| `logs/stdout_*.log` | Salida IIS / AspNetCore module |

Ver [`logs/README.md`](../src/HouseholdFinance.Api/logs/README.md) en el repositorio.

### HTTP 502.5

- Falta .NET 8 Hosting Bundle en el servidor.
- Variables de entorno no configuradas (JWT o connection string).

### Comprobar login

```bash
curl -X POST "https://tablas.innovasal.app/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"...\",\"password\":\"...\"}"
```

## Notas

- El seed **demo** solo corre en `Development`. En producción solo se siembran catálogos (`IncomeTypes`).
- Swagger está deshabilitado en Production.
- Tras editar `web.config` en el servidor, reiniciar el sitio desde el panel.
