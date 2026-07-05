# Checklist de seguridad

## Autenticación y autorización

- [x] JWT con validación issuer, audience, lifetime y signing key
- [x] Identity con política de contraseñas
- [x] Lockout tras intentos fallidos de login
- [x] Rate limiting en endpoint de login
- [x] `[Authorize]` en endpoints de dominio
- [x] Validación de pertenencia al hogar en servicios

## Configuración

- [x] Cadena SQL no hardcodeada en código
- [x] Validación al arranque si falta conexión o JWT key
- [x] `.env.example` sin secretos reales
- [x] `appsettings.json` con conexión vacía

## API

- [x] Middleware global de excepciones (sin stack trace al cliente en prod)
- [x] Correlation ID para trazabilidad
- [x] CORS restringido a orígenes configurados
- [x] Health check sin datos sensibles

## Datos

- [x] Auditoría de cierre/reapertura de período
- [x] Soft delete lógico (categorías, anulación gastos)
- [x] Idempotencia en creación de gastos

## Frontend

- [x] Token en almacenamiento; envío solo a API configurada
- [x] Rutas protegidas con guard de autenticación
- [x] Página 403 para acceso denegado

## Pendiente operativo (usuario)

- [ ] TLS/HTTPS en producción
- [ ] Rotación periódica de `JwtSettings__Key`
- [ ] Backup automatizado de SQL Server
- [ ] Deshabilitar Swagger en producción o restringir acceso
