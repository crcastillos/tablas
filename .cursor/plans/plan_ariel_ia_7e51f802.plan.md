---
name: Plan ARIEL IA
overview: Implementar ARIEL como agente de IA de solo lectura en `monolith-next`, accesible desde una nueva vista de chat y protegido por autenticación JWT, con contexto financiero obtenido del backend actual y consumo de OpenAI Responses API.
todos:
  - id: ariel-prompt-module
    content: Convertir system instruction a módulo tipado server-side y corregir formato inválido
    status: completed
  - id: ariel-api-auth
    content: Implementar /api/ariel/chat con requireAuth y validaciones de entrada
    status: completed
  - id: ariel-context-builder
    content: Construir contexto financiero de solo lectura desde SQL/servicios existentes
    status: completed
  - id: ariel-openai-integration
    content: Integrar OpenAI Responses API con manejo robusto de errores
    status: completed
  - id: ariel-chat-ui
    content: Crear vista de chat ARIEL en área autenticada del frontend
    status: completed
  - id: ariel-env-docs-tests
    content: Documentar variables OPENAI_* y ejecutar pruebas funcionales de seguridad/acceso
    status: completed
isProject: false
---

# Plan de implementación de ARIEL (IA) en monolith-next

## Validación inicial del `json_systeminstriction.md`
- El archivo [`intenciones/fase_2_ia/json_systeminstriction.md`](G:/Proyectos_cursor/tablas/intenciones/fase_2_ia/json_systeminstriction.md) **no es JSON válido**: tiene una llave de cierre extra al final.
- El contenido funcional del `instructions` es consistente con la lógica del dominio (presupuesto/gasto/ingresos) y con tu decisión de **solo lectura**.
- Ajuste de adaptación al proyecto actual:
  - ARIEL debe usar únicamente datos del hogar/periodo autorizados por JWT (`requireAuth`) y no aceptar contexto externo del cliente para evitar fuga de datos.
  - La plantilla `{{FINANCIAL_CONTEXT_JSON}}` debe generarse server-side con los servicios existentes de backend.

## Arquitectura objetivo (fase 2)
```mermaid
flowchart TD
user[Usuario autenticado] --> chatUi[Vista ARIEL en frontend]
chatUi --> apiAriel[/api/ariel/chat]
apiAriel --> authGuard[requireAuth JWT]
authGuard --> contextBuilder[Builder de contexto financiero]
contextBuilder --> db[(SQL Server)]
apiAriel --> openai[OpenAI Responses API]
openai --> apiAriel
apiAriel --> chatUi
```

## Plan por fases
1. **Normalizar y versionar la System Instruction de ARIEL**
   - Crear un módulo server-side para instruction/payload (`src/lib/ai/arielPrompt.ts`) en formato TypeScript tipado (evitar JSON suelto inválido).
   - Incorporar tu instrucción actual y corregir placeholders para variables reales del proyecto (`householdId`, `periodId`, moneda, zona horaria).
   - Mantener restricciones de seguridad: sin credenciales, sin acceso a otros hogares, sin mutaciones.

2. **Backend ARIEL autenticado (solo lectura)**
   - Crear endpoint [`monolith-next/src/app/api/ariel/chat/route.ts`](G:/Proyectos_cursor/tablas/monolith-next/src/app/api) protegido con `requireAuth`.
   - Validar entrada: mensaje usuario, `householdId`, `periodId`.
   - Obtener contexto financiero desde SQL mediante servicios existentes (`dashboard`, `budget`, `reports`, `incomes`, `expenses`) y consolidarlo en un `FinancialContext`.
   - Invocar OpenAI Responses API con `stream: true` o no-stream según decisión técnica de UI (empezar no-stream para acelerar primer release).

3. **Control de autorización y aislamiento de datos**
   - Reutilizar verificaciones de membresía/permiso del backend actual antes de construir contexto.
   - Bloquear solicitudes si el usuario no pertenece al hogar solicitado.
   - No aceptar `FINANCIAL_CONTEXT_JSON` desde frontend; solo usar contexto armado en backend.

4. **Nueva vista de chat ARIEL en frontend**
   - Agregar ruta de UI autenticada (por ejemplo `src/app/(app)/ariel/page.tsx`) con conversación básica.
   - Consumir `/api/ariel/chat` y renderizar respuesta en español con estado de carga/error.
   - Mostrar claramente hogar y período activos para evitar confusión de contexto.

5. **Configuración de entorno y despliegue**
   - Agregar variables requeridas:
     - `OPENAI_API_KEY` (secreta)
     - `OPENAI_MODEL` (por defecto configurable)
   - Documentar en [`monolith-next/README.md`](G:/Proyectos_cursor/tablas/monolith-next/README.md) pasos local + Netlify.

6. **Validación funcional y seguridad**
   - Pruebas E2E mínimas:
     - usuario autenticado puede chatear;
     - usuario no autenticado recibe 401;
     - usuario autenticado no puede consultar hogar ajeno;
     - respuesta usa datos reales del período.
   - Prueba de fallback por errores de OpenAI (mensaje de servicio no disponible).

## Momento exacto para configurar la OpenAI API Key
- **Primera vez requerida:** justo antes de probar el endpoint `/api/ariel/chat` (al final de fase 2).
- **Entornos:**
  - Local: `monolith-next/.env.local`
  - Producción Netlify: Environment Variables del sitio
- Sin `OPENAI_API_KEY`, el endpoint ARIEL debe responder error controlado y no romper la app principal.

## Entregables
- Endpoint autenticado `/api/ariel/chat`.
- Módulo de prompt/instruction tipado y validado.
- UI de chat ARIEL en sección autenticada.
- Documentación de variables (`OPENAI_API_KEY`, `OPENAI_MODEL`) y guía de pruebas.