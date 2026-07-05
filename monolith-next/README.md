# Monolith Next

Frontend + backend en Next App Router con backend Node nativo sobre SQL Server (`mssql`) y sin dependencia de API .NET externa.

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
- `/ariel`
- `/members`
- `/settings`

El shell incluye navegacion desktop/mobile, selector de hogar/periodo, gasto rapido, y logout con guardas de sesion.

## Arquitectura frontend

- `src/app/(auth)` para autenticacion.
- `src/app/(app)` para experiencia autenticada.
- `src/frontend/` con capa reusable (contextos, API client, layout, utilidades y paginas por dominio).
- `src/app/api/*` contiene los route handlers nativos (auth, households, periods, incomes, categories, recurring, budget, expenses, reports, health).

## Variables de entorno

Copiar `.env.example` a `.env.local` y completar valores reales.

Requeridas en runtime:

- `DefaultConnection`
- `JWT__Secret`
- `JWT__Issuer`
- `JWT__Audience`
- `JWT__ExpiresMinutes`
- `OPENAI_API_KEY` (solo server-side, requerida para `/api/ariel/chat`)

UI/publicas (sin secretos):

- `NEXT_PUBLIC_API_BASE_URL` (default `/api`)
- `NEXT_PUBLIC_APP_NAME`
- `NEXT_PUBLIC_DEFAULT_CURRENCY`
- `NEXT_PUBLIC_DEFAULT_TIME_ZONE`

Opcional server-side:

- `OPENAI_MODEL` (default `gpt-5.5-medium`)

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
- chat en `/ariel` con contexto de hogar/periodo
- validacion de fallback cuando falta `OPENAI_API_KEY`

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

Configurar en Netlify UI las variables sensibles (`DefaultConnection`, `JWT__Secret`, `JWT__Issuer`, `JWT__Audience`, `JWT__ExpiresMinutes`, `OPENAI_API_KEY`) antes de publicar.
