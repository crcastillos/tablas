# Logs de despliegue (MyAspnet / IIS)

Descargue estos archivos por **FTP** o **Administrador de archivos** del hosting y compártalos para diagnóstico.

## Ubicaciones (probar en este orden)

1. **`App_Data/logs/`** (principal en IIS; suele tener permiso de escritura)
2. **`logs/`** (respaldo junto al `.dll`)
3. Endpoint web: `GET /api/diagnostics/log` (muestra rutas y contenido reciente)

Ejemplo FTP:

```text
/site/wwwroot/tu-sitio/App_Data/logs/deployment-latest.log
/site/wwwroot/tu-sitio/App_Data/logs/stdout_*.log
```

## Archivos

| Archivo | Contenido |
|---|---|
| `deployment-latest.log` | Log principal |
| `deployment-YYYYMMDD.log` | Log del día |
| `stdout_*.log` | Salida IIS / AspNetCore module |

## Pasos

1. Publicar la API.
2. Visitar `https://tablas.innovasal.app/health`
3. Visitar `https://tablas.innovasal.app/api/diagnostics/log`
4. Descargar por FTP los archivos de `App_Data/logs/`
5. Compartir el JSON del endpoint o los archivos `.log`

## Si sigue vacío

- IIS no inició .NET → revisar Hosting Bundle 8.0
- Revisar permisos de escritura en `App_Data/logs/`
