# Roles y permisos

## Roles de hogar

| Rol | Valor | Descripción |
|---|---|---|
| Owner | 0 | Creador del hogar; permisos completos por defecto |
| Member | 1 | Integrante con permisos configurables |

## Flags por miembro

| Flag | Efecto |
|---|---|
| CanManageMembers | Agregar/editar integrantes |
| CanManagePeriods | Crear, cerrar y reabrir períodos |

## Matriz de acceso (resumen)

| Acción | Owner | Member (default) |
|---|---|---|
| Ver datos del hogar | Sí | Sí (si activo) |
| Crear ingresos/gastos/presupuesto | Sí | Sí (período abierto) |
| Gestionar miembros | Sí (flag) | Solo si CanManageMembers |
| Gestionar períodos | Sí (flag) | Solo si CanManagePeriods |

## API

- Todos los endpoints de dominio requieren `[Authorize]`.
- Servicios validan `HouseholdMember` activo antes de operar.
- Respuesta 403 si el usuario no pertenece al hogar o carece de permiso.

## Frontend

- `utils/permissions.ts`: `canManageMembers`, `canManagePeriods`.
- Páginas ocultan acciones según rol del hogar activo.
- Ruta `/403` para acceso denegado.
