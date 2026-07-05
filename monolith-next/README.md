# Monolith Next

Frontend de usuario final migrado a Next App Router con paridad funcional completa respecto al SPA previo, manteniendo consumo interno por `/api` y compatibilidad con el backend/proxy actual.

## Cobertura funcional

Rutas incluidas para usuario final:

- `/login` y `/register`
- `/` (dashboard)
- `/periods`
- `/incomes`
- `/budget`
- `/expenses`
- `/recurring`
- `/categories`
- `/reports`
- `/members`
- `/settings`

El shell incluye navegacion desktop/mobile, selector de hogar/periodo, gasto rapido, y logout con guardas de sesion.

## Arquitectura frontend

- `src/app/(auth)` para autenticacion.
- `src/app/(app)` para experiencia autenticada.
- `src/frontend/` con capa reusable (contextos, API client, layout, utilidades y paginas por dominio).
- `src/app/api/[...path]/route.ts` mantiene proxy hacia backend legado para rutas migradas (`auth`, `households`, `income-types`).

## Variables de entorno

Copiar `.env.example` a `.env.local` y completar valores reales.

Requeridas en runtime:

- `DefaultConnection`
- `JWT__Secret` (y/o variables `JWT*`)
- `LEGACY_API_BASE_URL`

UI/publicas (sin secretos):

- `NEXT_PUBLIC_API_BASE_URL` (default `/api`)
- `NEXT_PUBLIC_APP_NAME`
- `NEXT_PUBLIC_DEFAULT_CURRENCY`
- `NEXT_PUBLIC_DEFAULT_TIME_ZONE`

## Pruebas locales

1. Instalar dependencias:

```bash
npm install
```

2. Ejecutar app:

```bash
npm run dev
```

3. Validar build de produccion:

```bash
npm run typecheck
npm run build
```

4. Smoke recomendado de paridad (manual):

- login/register/logout
- cambio de hogar y periodo
- alta de ingreso, presupuesto y gasto
- navegacion completa por menu
- reportes y exportacion Excel

5. Validacion de corte tecnico (requiere app levantada y variables backend validas):

```bash
npm run validate:cutover
```

## Deploy en Netlify

`netlify.toml` ya incluye:

- build command `npm run build`
- publish `.next`
- plugin `@netlify/plugin-nextjs`
- defaults de variables `NEXT_PUBLIC_*` para frontend

Configurar en Netlify UI las variables sensibles (`DefaultConnection`, `JWT*`, `LEGACY_API_BASE_URL`) antes de publicar.
