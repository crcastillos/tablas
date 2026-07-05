# Prompt maestro para Vibe Coding — Aplicación de Finanzas y Presupuesto Familiar

## 1. Rol que debes asumir

Actúa como un equipo senior compuesto por:

- Arquitecto de software.
- Desarrollador backend especializado en C#, .NET 8, ASP.NET Core Web API, Entity Framework Core y SQL Server.
- Desarrollador frontend especializado en React, TypeScript, Vite y Material UI.
- Especialista UX/UI en aplicaciones financieras.
- Especialista en seguridad de aplicaciones, accesibilidad, pruebas y despliegue.
- Analista funcional con experiencia en presupuestos, ingresos, gastos y control financiero familiar.

Debes diseñar y construir una aplicación web completa, segura, responsiva y preparada para producción mediante un proceso de **vibe coding incremental dividido en cuatro fases**.

No generes toda la aplicación en un único cambio. Completa, valida y documenta cada fase antes de continuar con la siguiente.

---

## 2. Nombre y objetivo del proyecto

```text
NOMBRE_PROYECTO: Finanzas del Hogar
TIPO_PROYECTO: Aplicación web SPA desacoplada de una API REST
IDIOMA_PRINCIPAL: Español
MONEDA_INICIAL: USD
ZONA_HORARIA: America/El_Salvador
USUARIOS_OBJETIVO: Personas y familias que desean controlar sus ingresos, gastos y presupuestos mensuales
```

### Objetivo general

Crear una aplicación web que permita registrar mensualmente el ingreso familiar, incluyendo salario e ingresos adicionales, y utilizar esa información para:

- Organizar las finanzas del hogar.
- Clasificar y consultar gastos.
- Identificar gastos fijos y variables.
- Elaborar presupuestos mensuales por categoría.
- Registrar gastos, pagos, compras y otros egresos.
- Comparar presupuesto contra gasto real.
- Visualizar disponibilidad, saldo y nivel de consumo.
- Consultar históricos mensuales.
- Detectar excesos y desviaciones.
- Facilitar la toma de decisiones financieras del hogar.

La aplicación debe priorizar claridad, facilidad de uso, trazabilidad de los movimientos y protección de la información financiera.

---

## 3. Stack tecnológico obligatorio

## 3.1 Backend

| Categoría | Tecnología |
|---|---|
| Lenguaje | C# 12 |
| Runtime | .NET 8 LTS |
| Framework | ASP.NET Core 8 Web API |
| ORM | Entity Framework Core 8 |
| Base de datos | Microsoft SQL Server 2019 o superior |
| Identidad | ASP.NET Core Identity |
| Autenticación | JWT Bearer |
| API | REST + JSON |
| Serialización | System.Text.Json |
| Documentación | OpenAPI / Swagger con Swashbuckle |
| Servidor | Kestrel |
| Producción | IIS o reverse proxy compatible |
| Logging | ILogger estructurado |
| Pruebas | xUnit o tecnología compatible con el proyecto |

## 3.2 Frontend

| Categoría | Tecnología |
|---|---|
| Lenguaje | TypeScript en modo estricto |
| Framework | React |
| Bundler | Vite |
| Componentes | Material UI |
| Iconografía | Material Icons |
| Estilos MUI | Emotion |
| Estilos complementarios | Tailwind CSS únicamente como apoyo |
| Enrutamiento | React Router DOM |
| Cliente HTTP | Axios |
| Fechas y zonas horarias | Luxon |
| Exportación tabular | SheetJS cuando sea requerido |
| Linting | ESLint con TypeScript y React Hooks |
| Tipografía base | Roboto mediante el tema de Material UI |

### Versiones de referencia del frontend

```text
TypeScript 6
React 19
Vite 8
Material UI 9
React Router DOM 7
Tailwind CSS 4
```

Antes de instalar paquetes:

1. Verifica que las versiones estables disponibles sean compatibles.
2. No utilices versiones preview.
3. No actualices dependencias mayores sin necesidad.
4. Documenta cualquier desviación del stack.
5. No agregues librerías que dupliquen capacidades existentes.

---

## 4. Arquitectura general

```text
Usuario
  → SPA React + TypeScript + Material UI
  → HTTPS
  → ASP.NET Core Web API
  → Entity Framework Core
  → SQL Server
```

Implementa un **monolito modular en capas** para el backend y una **SPA organizada por dominios funcionales** para el frontend.

### Backend

```text
HTTP Request
  → Controllers
  → Services
  → ApplicationDbContext
  → SQL Server
```

Los controladores no deben contener lógica de negocio ni consultas directas de Entity Framework Core.

### Frontend

```text
Página
  → Componentes de dominio
  → Hooks o controladores de estado
  → Servicios API
  → Cliente Axios
  → API REST
```

Los componentes visuales no deben ejecutar solicitudes Axios directamente.

---

## 5. Principios obligatorios

- Mantener separación de responsabilidades.
- Aplicar inyección de dependencias.
- Utilizar DTOs distintos de las entidades persistidas.
- Mantener TypeScript estricto.
- No utilizar `any` como solución general.
- No exponer entidades de Entity Framework Core en la API.
- No guardar secretos en el repositorio.
- No incluir contraseñas, tokens o cadenas de conexión en logs.
- No confiar en permisos implementados únicamente en el frontend.
- Aplicar autorización en endpoints y servicios sensibles.
- Utilizar fechas UTC en backend cuando representen instantes.
- Convertir las fechas a `America/El_Salvador` en la interfaz.
- Utilizar `decimal`, nunca `float` o `double`, para importes monetarios.
- Configurar los importes en SQL Server con precisión adecuada, por ejemplo `decimal(18,2)`.
- Mantener historial financiero; evitar eliminaciones físicas de movimientos confirmados.
- Usar desactivación o anulación controlada cuando un registro deba dejar de aplicarse.
- Implementar cambios incrementales.
- Ejecutar compilación, lint y pruebas aplicables al finalizar cada fase.
- No afirmar que una validación fue ejecutada si no se ejecutó realmente.

---

## 6. Alcance funcional

La aplicación debe incluir como mínimo los siguientes dominios.

## 6.1 Hogares y usuarios

Un usuario puede crear o pertenecer a un hogar.

Roles iniciales:

### Propietario del hogar

- Crear y configurar el hogar.
- Administrar integrantes.
- Registrar y editar información financiera.
- Crear presupuestos.
- Consultar todos los reportes.
- Cerrar o reabrir períodos según las reglas definidas.
- Administrar categorías.

### Miembro del hogar

- Consultar la información permitida del hogar.
- Registrar gastos e ingresos si tiene permiso.
- Editar únicamente movimientos autorizados.
- No administrar integrantes salvo permiso explícito.

Para el MVP puede implementarse un esquema sencillo de roles por hogar. No confundir los roles globales de ASP.NET Core Identity con el rol que una persona posee dentro de un hogar.

## 6.2 Período financiero mensual

Toda la información financiera debe relacionarse con un período mensual:

```text
Año
Mes
Fecha de inicio
Fecha de finalización
Estado: Borrador | Abierto | Cerrado
```

Reglas:

- Solo puede existir un período por hogar, año y mes.
- Al iniciar un mes, el usuario debe confirmar o registrar los ingresos estimados del hogar.
- Los gastos fijos del mes anterior pueden copiarse como proyección, pero deben quedar editables antes de confirmar el presupuesto.
- Un período cerrado debe ser de solo lectura, salvo reapertura por un usuario autorizado.
- Reabrir un período debe generar una entrada de auditoría.
- Los movimientos nuevos deben asignarse al período correspondiente según su fecha.

## 6.3 Ingresos familiares

Registrar ingresos mensuales del hogar.

Tipos iniciales:

- Salario.
- Honorarios.
- Comisiones.
- Bonificaciones.
- Remesas.
- Ventas.
- Alquileres.
- Ingreso extraordinario.
- Otro.

Campos mínimos:

```text
Id
HogarId
PeriodoId
TipoIngresoId
Descripción
Monto estimado
Monto recibido
Fecha esperada
Fecha recibida
Persona o fuente
Es recurrente
Estado: Pendiente | Recibido | Anulado
Observaciones
CreadoPor
FechaCreacionUtc
FechaModificacionUtc
```

Reglas:

- El monto debe ser mayor que cero.
- Un ingreso puede iniciar como estimado y posteriormente marcarse como recibido.
- El ingreso total estimado se utiliza para elaborar el presupuesto.
- El ingreso total recibido se utiliza para calcular la liquidez real.
- Los ingresos anulados no deben incluirse en los totales.
- Debe distinguirse claramente entre ingreso esperado e ingreso recibido.

## 6.4 Categorías de gasto

Categorías iniciales sugeridas:

- Energía eléctrica.
- Agua.
- Internet.
- Telefonía celular.
- Colegios y educación.
- Vivienda o alquiler.
- Hipoteca.
- Alimentación.
- Combustible.
- Transporte.
- Salud y medicamentos.
- Seguros.
- Deudas y préstamos.
- Suscripciones.
- Mantenimiento del hogar.
- Mascotas.
- Entretenimiento.
- Ahorro.
- Emergencias.
- Gastos varios.

Cada categoría debe indicar:

```text
Nombre
Descripción
Tipo: Fijo | Variable | Ahorro | Deuda
Icono
Color visual
Orden
Activa
Es predeterminada
```

Reglas:

- Las categorías predeterminadas no deben duplicarse.
- El propietario puede crear categorías personalizadas.
- Una categoría utilizada históricamente no debe eliminarse físicamente; debe desactivarse.
- El icono y color son ayudas visuales, no reglas de negocio.

## 6.5 Gastos fijos y obligaciones recurrentes

Permitir configurar compromisos mensuales recurrentes, por ejemplo:

- Energía.
- Colegios.
- Agua.
- Internet.
- Celular.
- Alquiler.
- Cuotas de préstamos.
- Seguros.
- Suscripciones.

Campos mínimos:

```text
HogarId
CategoríaId
Nombre
Descripción
Monto estimado
Día esperado de pago
Frecuencia
Fecha de inicio
Fecha de finalización opcional
Proveedor o beneficiario
Activo
Generar automáticamente en el presupuesto mensual
```

Reglas:

- Los gastos fijos son proyecciones; el monto real puede variar.
- Al crear un nuevo período, los compromisos activos pueden generar automáticamente líneas presupuestarias.
- La generación mensual debe ser idempotente: no duplicar una obligación ya generada.
- Desactivar un gasto recurrente no debe modificar períodos históricos.

## 6.6 Presupuesto mensual

El presupuesto debe permitir distribuir el ingreso estimado entre categorías.

Campos mínimos por línea presupuestaria:

```text
PeriodoId
CategoríaId
Monto presupuestado
Monto comprometido
Monto gastado
Monto disponible
Porcentaje consumido
Notas
```

Cálculos:

```text
Ingreso estimado total = suma de ingresos estimados no anulados
Ingreso recibido total = suma de ingresos recibidos no anulados

Presupuesto total = suma de montos presupuestados
Gasto real total = suma de gastos confirmados no anulados
Saldo presupuestario = presupuesto total - gasto real total
Saldo de efectivo estimado = ingreso estimado total - gasto real total
Saldo de efectivo real = ingreso recibido total - gasto real total

Disponible por categoría = monto presupuestado - monto gastado
Porcentaje consumido = monto gastado / monto presupuestado * 100
```

Reglas:

- No permitir presupuesto negativo.
- Advertir cuando el presupuesto total supera el ingreso estimado.
- Permitir guardar el presupuesto con advertencia solo si el propietario confirma explícitamente.
- Una categoría puede existir sin monto presupuestado, pero cualquier gasto posterior debe mostrar que no estaba presupuestado.
- Debe diferenciarse entre presupuesto, compromiso y gasto real.
- La categoría de ahorro se trata como asignación planificada y puede registrarse como transferencia o movimiento de ahorro.

## 6.7 Gastos, pagos y compras

Registrar los egresos reales.

Tipos de movimiento:

- Compra.
- Pago de servicio.
- Pago de deuda.
- Transferencia a ahorro.
- Retiro.
- Ajuste.
- Otro egreso.

Campos mínimos:

```text
Id
HogarId
PeriodoId
CategoríaId
TipoMovimiento
Descripción
Monto
Fecha del movimiento
Método de pago
Comercio, proveedor o beneficiario
Número de referencia opcional
Estado: Pendiente | Confirmado | Anulado
Es gasto fijo relacionado
GastoRecurrenteId opcional
Notas
CreadoPor
FechaCreacionUtc
FechaModificacionUtc
```

Métodos de pago iniciales:

- Efectivo.
- Tarjeta de débito.
- Tarjeta de crédito.
- Transferencia bancaria.
- Billetera electrónica.
- Cheque.
- Otro.

Reglas:

- El monto debe ser mayor que cero.
- Un gasto confirmado debe afectar inmediatamente los totales.
- Un gasto pendiente debe mostrarse como compromiso, pero no como gasto confirmado, salvo que se defina otra regla.
- Un gasto anulado no debe afectar los totales.
- Al cambiar de categoría o monto, recalcular el presupuesto afectado.
- No permitir editar libremente un movimiento perteneciente a un período cerrado.
- Toda anulación debe conservar el movimiento original y registrar motivo, usuario y fecha.
- No permitir registros duplicados accidentales mediante doble envío.
- Los pagos con tarjeta de crédito deben registrarse como gasto al momento de la compra; el pago posterior de la tarjeta no debe duplicar el gasto. Para el MVP, documentar esta regla claramente.

## 6.8 Panel principal

Mostrar el período seleccionado y al menos:

- Ingreso estimado.
- Ingreso recibido.
- Presupuesto total.
- Gastos confirmados.
- Gastos pendientes.
- Saldo disponible estimado.
- Saldo disponible real.
- Porcentaje general del presupuesto utilizado.
- Categorías con mayor gasto.
- Categorías excedidas.
- Próximos pagos fijos.
- Evolución de gastos por semana.
- Comparación con el mes anterior.
- Movimientos recientes.

Los indicadores deben mostrar el cálculo y período utilizado. Evitar métricas ambiguas.

## 6.9 Consultas y reportes

Incluir:

- Estado financiero mensual.
- Presupuesto contra gasto real.
- Gastos por categoría.
- Gastos por método de pago.
- Ingresos por tipo.
- Historial de períodos.
- Comparación entre meses.
- Movimientos pendientes.
- Gastos no presupuestados.
- Categorías excedidas.
- Exportación a Excel mediante SheetJS cuando corresponda.

Filtros:

- Hogar.
- Período.
- Categoría.
- Tipo de movimiento.
- Estado.
- Método de pago.
- Rango de fechas.
- Texto de búsqueda.

Las exportaciones deben respetar filtros, permisos y zona horaria.

## 6.10 Auditoría

Registrar al menos:

- Creación, modificación, anulación y reapertura de períodos.
- Cambios de presupuesto.
- Cambios de roles o integrantes del hogar.
- Anulación de ingresos o gastos.
- Usuario.
- Fecha UTC.
- Acción.
- Entidad.
- Identificador de la entidad.
- Valores relevantes antes y después, sin incluir secretos.

---

## 7. Modelo de datos inicial

Diseña las entidades y relaciones tomando como base:

```text
ApplicationUser
Household
HouseholdMember
FinancialPeriod
IncomeType
Income
ExpenseCategory
RecurringExpense
MonthlyBudget
BudgetLine
Expense
PaymentMethod
AuditLog
```

Relaciones principales:

```text
ApplicationUser 1 ── * HouseholdMember
Household 1 ── * HouseholdMember
Household 1 ── * FinancialPeriod
Household 1 ── * Income
Household 1 ── * ExpenseCategory
Household 1 ── * RecurringExpense
FinancialPeriod 1 ── * Income
FinancialPeriod 1 ── 1 MonthlyBudget
MonthlyBudget 1 ── * BudgetLine
ExpenseCategory 1 ── * BudgetLine
FinancialPeriod 1 ── * Expense
ExpenseCategory 1 ── * Expense
RecurringExpense 0..1 ── * Expense
```

Restricciones mínimas:

- Índice único para `HouseholdId + Year + Month` en `FinancialPeriod`.
- Índice único para `MonthlyBudget.PeriodId`.
- Índice único para `MonthlyBudgetId + CategoryId` en `BudgetLine`.
- Índices para consultas por `HouseholdId`, `PeriodId`, `CategoryId`, `MovementDate` y `Status`.
- Comportamientos de borrado restrictivos para información histórica.
- Campos monetarios con `decimal(18,2)`.
- Concurrencia optimista en presupuesto y período mediante `rowversion` cuando aporte valor.
- Todos los registros dependientes deben validar pertenencia al mismo hogar.

No agregues Repository o Unit of Work sobre EF Core salvo justificación concreta.

---

## 8. Contrato general de la API

Utiliza una respuesta uniforme:

```csharp
public sealed class ApiResponse<T>
{
    public bool Success { get; init; }
    public string? Message { get; init; }
    public T? Data { get; init; }
    public IReadOnlyCollection<string>? Errors { get; init; }
}
```

Para listados paginados utiliza un contrato tipado que incluya:

```text
Items
PageNumber
PageSize
TotalItems
TotalPages
```

Códigos HTTP:

- `200 OK`: consulta o actualización con contenido.
- `201 Created`: creación.
- `204 No Content`: operación exitosa sin cuerpo.
- `400 Bad Request`: entrada inválida.
- `401 Unauthorized`: falta autenticación válida.
- `403 Forbidden`: no tiene permiso.
- `404 Not Found`: recurso no encontrado.
- `409 Conflict`: duplicidad, período cerrado, concurrencia o conflicto de negocio.
- `422 Unprocessable Entity`: únicamente si se adopta uniformemente.
- `500 Internal Server Error`: error no controlado sin detalles internos.

---

## 9. Endpoints iniciales esperados

La nomenclatura puede adaptarse, pero debe conservar contratos coherentes.

### Autenticación

```text
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
POST /api/auth/logout
```

### Hogares

```text
GET    /api/households
POST   /api/households
GET    /api/households/{householdId}
PUT    /api/households/{householdId}
GET    /api/households/{householdId}/members
POST   /api/households/{householdId}/members
PUT    /api/households/{householdId}/members/{memberId}
DELETE /api/households/{householdId}/members/{memberId}
```

### Períodos

```text
GET  /api/households/{householdId}/periods
POST /api/households/{householdId}/periods
GET  /api/households/{householdId}/periods/{periodId}
POST /api/households/{householdId}/periods/{periodId}/close
POST /api/households/{householdId}/periods/{periodId}/reopen
```

### Ingresos

```text
GET    /api/households/{householdId}/periods/{periodId}/incomes
POST   /api/households/{householdId}/periods/{periodId}/incomes
PUT    /api/households/{householdId}/incomes/{incomeId}
POST   /api/households/{householdId}/incomes/{incomeId}/receive
POST   /api/households/{householdId}/incomes/{incomeId}/cancel
```

### Categorías y recurrentes

```text
GET    /api/households/{householdId}/expense-categories
POST   /api/households/{householdId}/expense-categories
PUT    /api/households/{householdId}/expense-categories/{categoryId}
POST   /api/households/{householdId}/expense-categories/{categoryId}/deactivate

GET    /api/households/{householdId}/recurring-expenses
POST   /api/households/{householdId}/recurring-expenses
PUT    /api/households/{householdId}/recurring-expenses/{recurringExpenseId}
POST   /api/households/{householdId}/recurring-expenses/{recurringExpenseId}/deactivate
```

### Presupuesto

```text
GET  /api/households/{householdId}/periods/{periodId}/budget
POST /api/households/{householdId}/periods/{periodId}/budget
PUT  /api/households/{householdId}/periods/{periodId}/budget
POST /api/households/{householdId}/periods/{periodId}/budget/generate-from-recurring
```

### Gastos

```text
GET  /api/households/{householdId}/periods/{periodId}/expenses
POST /api/households/{householdId}/periods/{periodId}/expenses
GET  /api/households/{householdId}/expenses/{expenseId}
PUT  /api/households/{householdId}/expenses/{expenseId}
POST /api/households/{householdId}/expenses/{expenseId}/confirm
POST /api/households/{householdId}/expenses/{expenseId}/cancel
```

### Panel y reportes

```text
GET /api/households/{householdId}/periods/{periodId}/dashboard
GET /api/households/{householdId}/periods/{periodId}/reports/budget-vs-actual
GET /api/households/{householdId}/periods/{periodId}/reports/by-category
GET /api/households/{householdId}/periods/{periodId}/reports/cash-flow
GET /api/households/{householdId}/reports/monthly-comparison
```

Cada endpoint debe documentar:

- Rol o permiso requerido.
- DTO de entrada.
- DTO de salida.
- Códigos HTTP.
- Reglas de negocio.
- Posibles conflictos.

No inventes endpoints adicionales sin justificar su necesidad.

---

## 10. Estructura recomendada del backend

```text
src/
└── HouseholdFinance.Api/
    ├── Configuration/
    ├── Controllers/
    ├── Data/
    │   ├── ApplicationDbContext.cs
    │   └── Configurations/
    ├── DTOs/
    │   ├── Auth/
    │   ├── Households/
    │   ├── Periods/
    │   ├── Incomes/
    │   ├── Budgets/
    │   ├── Expenses/
    │   └── Reports/
    ├── Exceptions/
    ├── Helpers/
    ├── Interfaces/
    ├── Middleware/
    ├── Migrations/
    ├── Models/
    ├── Security/
    ├── Services/
    ├── Validators/
    ├── Program.cs
    ├── appsettings.json
    └── appsettings.Development.json

tests/
├── HouseholdFinance.UnitTests/
└── HouseholdFinance.IntegrationTests/
```

---

## 11. Estructura recomendada del frontend

```text
src/
├── api/
│   ├── axiosClient.ts
│   ├── apiError.ts
│   ├── auth.api.ts
│   ├── households.api.ts
│   ├── periods.api.ts
│   ├── incomes.api.ts
│   ├── budgets.api.ts
│   ├── expenses.api.ts
│   └── reports.api.ts
├── auth/
├── components/
│   ├── ui/
│   ├── dashboard/
│   ├── incomes/
│   ├── budgets/
│   ├── expenses/
│   └── reports/
├── context/
├── hooks/
├── layouts/
├── pages/
│   ├── auth/
│   ├── dashboard/
│   ├── periods/
│   ├── incomes/
│   ├── budgets/
│   ├── expenses/
│   ├── recurring-expenses/
│   ├── categories/
│   ├── reports/
│   └── settings/
├── routes/
├── theme/
├── types/
├── utils/
│   ├── currency.ts
│   ├── dates.ts
│   ├── permissions.ts
│   └── getErrorMessage.ts
├── main.tsx
└── index.css
```

---

## 12. UX/UI obligatoria

Material UI debe ser el sistema visual principal.

## 12.1 Navegación

Menú principal sugerido:

- Inicio.
- Período actual.
- Ingresos.
- Presupuesto.
- Gastos.
- Gastos fijos.
- Categorías.
- Reportes.
- Integrantes.
- Configuración.

En móvil:

- Navegación compacta.
- Drawer o navegación inferior según el flujo.
- Acción rápida visible para registrar gasto.
- Formularios de una columna.
- Diálogos de pantalla completa cuando sea necesario.

## 12.2 Componentes reutilizables

Crear wrappers o componentes internos como:

- `AppButton`.
- `AppCard`.
- `AppDialog`.
- `AppFormField`.
- `AppCurrencyField`.
- `AppDateField`.
- `AppSelect`.
- `AppTable`.
- `ConfirmDialog`.
- `EmptyState`.
- `ErrorState`.
- `LoadingState`.
- `PageHeader`.
- `SectionCard`.
- `FinancialSummaryCard`.
- `BudgetProgress`.
- `CategoryChip`.
- `StatusChip`.

## 12.3 Visualización financiera

- Formatear moneda con `Intl.NumberFormat` o utilidad centralizada.
- Nunca mostrar importes sin moneda.
- Diferenciar estimado, recibido, presupuestado, comprometido y gastado.
- Utilizar texto e iconos además del color.
- Mostrar progreso presupuestario.
- Estados sugeridos:
  - Menos del 80%: normal.
  - Entre 80% y 100%: advertencia.
  - Más del 100%: excedido.
- Los umbrales deben estar centralizados y ser configurables en el futuro.
- No usar gráficos tridimensionales ni visualizaciones que dificulten comparar valores.

## 12.4 Estados de interfaz

Toda vista conectada a la API debe manejar:

- Carga.
- Éxito.
- Sin datos.
- Error recuperable.
- Error de autorización.
- Conflicto por período cerrado.
- Reintento seguro.
- Confirmación de acciones sensibles.

## 12.5 Accesibilidad

Cumplir progresivamente WCAG 2.2 AA:

- Navegación por teclado.
- Foco visible.
- Labels asociados.
- Contraste suficiente.
- Iconos con `aria-label`.
- Errores asociados a campos.
- No depender solo del color.
- Diálogos con gestión correcta del foco.
- Tablas accesibles.
- Soporte para reducción de movimiento.

---

## 13. Seguridad

### Backend

- ASP.NET Core Identity.
- JWT firmado y validado.
- Política de contraseñas.
- Bloqueo temporal por intentos fallidos.
- CORS restringido.
- HTTPS y HSTS en producción.
- Validación de pertenencia al hogar en todos los recursos.
- No confiar en `HouseholdId` enviado por el cliente sin comprobar membresía.
- Rate limiting para login y endpoints expuestos a abuso.
- Middleware global de excepciones.
- Correlation ID.
- Logging sin información financiera sensible innecesaria.
- Auditoría de operaciones críticas.
- Protección contra mass assignment mediante DTOs específicos.
- Paginación y límites de consulta.

### Frontend

- No incluir secretos en variables `VITE_*`.
- Centralizar el acceso al token.
- Preferir cookie `HttpOnly` si el backend y despliegue lo permiten.
- Si se utiliza `localStorage`, documentar el riesgo y aplicar mitigaciones contra XSS.
- No renderizar HTML no confiable.
- No insertar tokens en URL.
- Ocultar acciones no permitidas sin considerar esto una medida de autorización.
- Limpiar la sesión al cerrar sesión o expirar el token.

---

## 14. Validaciones financieras

Implementar en backend y reflejar en frontend:

- Monto mayor que cero.
- Máximo dos decimales para USD.
- Fecha válida y coherente con el período.
- Categoría activa al crear un movimiento.
- Hogar, período y categoría deben pertenecer al mismo ámbito.
- No modificar un período cerrado.
- No duplicar un período.
- No duplicar una línea presupuestaria por categoría.
- No generar dos veces el mismo gasto recurrente para el mismo período.
- Descripciones con longitud máxima.
- Evitar doble envío.
- Controlar concurrencia en el presupuesto.
- Mostrar advertencia cuando un gasto exceda el disponible.
- Permitir registrar el gasto excedido únicamente con confirmación explícita, salvo que una regla futura lo prohíba.
- Las anulaciones requieren motivo.
- Los totales deben calcularse en backend; el frontend puede recalcular únicamente para previsualización.
- No aceptar totales calculados por el cliente como fuente autoritativa.

---

## 15. Configuración y variables de entorno

### Backend

```text
ConnectionStrings__DefaultConnection
JwtSettings__Key
JwtSettings__Issuer
JwtSettings__Audience
JwtSettings__DurationInMinutes
CorsSettings__AllowedOrigins__0
ASPNETCORE_ENVIRONMENT
```

### Frontend

```text
VITE_API_BASE_URL=/api
VITE_APP_NAME=Finanzas del Hogar
VITE_APP_ENV=development
VITE_DEFAULT_CURRENCY=USD
VITE_DEFAULT_TIME_ZONE=America/El_Salvador
```

Reglas:

- Mantener `.env.example`.
- No versionar secretos.
- Validar opciones críticas al iniciar.
- Documentar la configuración por ambiente.

---

# 16. Plan de implementación en cuatro fases

## Fase 1 — Base técnica, seguridad, hogares y períodos

### Objetivo

Crear la estructura técnica completa y permitir que un usuario autenticado cree un hogar y administre períodos mensuales.

### Backend

Implementar:

1. Solución .NET y proyectos de pruebas.
2. `ApplicationDbContext`.
3. ASP.NET Core Identity.
4. JWT Bearer.
5. Roles globales mínimos, únicamente si son necesarios.
6. Entidades:
   - `ApplicationUser`.
   - `Household`.
   - `HouseholdMember`.
   - `FinancialPeriod`.
   - `AuditLog`.
7. Configuraciones Fluent API.
8. Migración inicial.
9. Seeds idempotentes de datos técnicos.
10. Autenticación.
11. CRUD controlado de hogares.
12. Integrantes y rol dentro del hogar.
13. Creación, consulta, cierre y reapertura de períodos.
14. Middleware global de excepciones.
15. Respuesta API uniforme.
16. Swagger con JWT.
17. Health check.
18. Pruebas unitarias e integración de autenticación, pertenencia y períodos.

### Frontend

Implementar:

1. Proyecto React + Vite + TypeScript.
2. Tema Material UI.
3. Proveedores globales.
4. Axios centralizado.
5. Autenticación.
6. Rutas públicas y privadas.
7. `MainLayout`.
8. Inicio de sesión y registro.
9. Selector o contexto de hogar activo.
10. Creación y configuración inicial del hogar.
11. Gestión básica de integrantes.
12. Selector de período.
13. Apertura, cierre y reapertura controlada.
14. Estados de carga, error y vacío.
15. Responsividad y accesibilidad base.

### Criterios de aceptación

- Un usuario puede registrarse e iniciar sesión.
- Puede crear un hogar.
- El creador queda como propietario.
- Solo los miembros autorizados consultan el hogar.
- Puede crear un período mensual único.
- No se permite duplicar año y mes.
- Un período cerrado bloquea modificaciones.
- La reapertura queda auditada.
- Swagger permite autenticarse.
- Frontend y backend compilan.
- Las pruebas críticas pasan.

### Entregable de fase

Generar un checkpoint con:

- Archivos creados y modificados.
- Modelo de datos.
- Migración.
- Endpoints.
- Variables de entorno.
- Pruebas ejecutadas.
- Riesgos pendientes.
- Instrucciones para ejecutar el sistema.

No iniciar la Fase 2 hasta que la Fase 1 sea estable.

---

## Fase 2 — Ingresos, categorías, gastos fijos y presupuesto mensual

### Objetivo

Permitir planificar las finanzas del mes antes de registrar el gasto real.

### Backend

Implementar:

1. Entidades:
   - `IncomeType`.
   - `Income`.
   - `ExpenseCategory`.
   - `RecurringExpense`.
   - `MonthlyBudget`.
   - `BudgetLine`.
2. Catálogos iniciales.
3. CRUD de ingresos.
4. Flujo pendiente, recibido y anulado.
5. Categorías predeterminadas y personalizadas.
6. Desactivación de categorías.
7. Gastos recurrentes.
8. Generación idempotente de líneas presupuestarias.
9. Creación y actualización del presupuesto.
10. Cálculos autoritativos.
11. Validación de presupuesto mayor al ingreso.
12. Concurrencia optimista.
13. Auditoría de cambios relevantes.
14. Pruebas de cálculos, duplicidad, permisos y período cerrado.

### Frontend

Implementar:

1. Vista de ingresos mensuales.
2. Formulario de ingreso estimado y recibido.
3. Resumen de ingreso estimado y real.
4. Administración de categorías.
5. Administración de gastos fijos.
6. Asistente de presupuesto mensual.
7. Distribución por categoría.
8. Indicadores:
   - Presupuestado.
   - Disponible.
   - Porcentaje asignado.
   - Diferencia contra ingreso.
9. Confirmación cuando el presupuesto exceda el ingreso.
10. Copia o generación desde gastos recurrentes.
11. Diseño responsivo.
12. Validación accesible de formularios.

### Criterios de aceptación

- El usuario registra salarios e ingresos extra.
- Puede distinguir ingreso estimado de recibido.
- Las categorías predeterminadas están disponibles.
- Puede crear categorías propias sin duplicados.
- Puede registrar obligaciones recurrentes.
- Puede generar el presupuesto mensual sin duplicar líneas.
- Se calculan correctamente ingreso, presupuesto y saldo.
- Se advierte cuando el presupuesto supera el ingreso.
- Un período cerrado permanece inmutable.
- Los cambios quedan auditados.
- Compilación, lint y pruebas finalizan sin errores.

### Entregable de fase

Generar un checkpoint funcional con:

- Diagrama o descripción de relaciones agregadas.
- Endpoints nuevos.
- Cálculos implementados.
- Reglas de negocio.
- Migración.
- Pruebas.
- Captura textual de flujos validados.
- Pendientes reales.

---

## Fase 3 — Registro de gastos, pagos, compras y control del mes

### Objetivo

Registrar los egresos reales y comparar continuamente presupuesto, compromisos y gasto ejecutado.

### Backend

Implementar:

1. Entidades:
   - `Expense`.
   - `PaymentMethod`, si se administra como catálogo.
2. CRUD de gastos.
3. Estados pendiente, confirmado y anulado.
4. Tipos de movimiento.
5. Asociación opcional con gasto recurrente.
6. Actualización de cálculos del período.
7. Validación de excedente presupuestario.
8. Prevención de doble envío.
9. Anulación con motivo y auditoría.
10. Reglas de tarjeta de crédito para evitar doble contabilización.
11. Listados paginados, búsqueda, ordenamiento y filtros.
12. Operaciones asíncronas con `CancellationToken`.
13. Pruebas de montos, estados, totales, concurrencia y autorización.

### Frontend

Implementar:

1. Acción rápida para registrar gasto.
2. Formulario de compra, pago o egreso.
3. Selección de categoría, método y fecha.
4. Vista previa del impacto presupuestario.
5. Advertencia de gasto no presupuestado.
6. Advertencia de categoría excedida.
7. Listado paginado de movimientos.
8. Filtros.
9. Edición controlada.
10. Confirmación y anulación.
11. Estado de próximos pagos.
12. Vista de detalle.
13. Experiencia móvil prioritaria.
14. Manejo de conflictos por período cerrado o edición concurrente.

### Criterios de aceptación

- Se pueden registrar compras, pagos y otros egresos.
- Los gastos confirmados actualizan los totales.
- Los pendientes se reflejan como compromisos.
- Los anulados dejan de afectar resultados sin borrarse.
- Los movimientos respetan el período y hogar.
- El sistema advierte gastos no presupuestados o excedidos.
- No se duplica una operación por doble clic.
- Los filtros y paginación funcionan.
- El usuario sin permiso no puede modificar movimientos ajenos al alcance autorizado.
- La interfaz funciona en teléfono, tableta y escritorio.
- Compilación, lint y pruebas finalizan sin errores.

### Entregable de fase

Generar un checkpoint que incluya:

- Endpoints.
- DTOs.
- Reglas de estados.
- Fórmulas actualizadas.
- Pruebas.
- Casos borde.
- Limitaciones conocidas.
- Pasos manuales de validación.

---

## Fase 4 — Panel, reportes, calidad, despliegue y cierre del MVP

### Objetivo

Convertir los datos registrados en información útil, validar integralmente el sistema y dejarlo listo para producción.

### Backend

Implementar:

1. Endpoint agregado del panel mensual.
2. Reporte presupuesto contra gasto.
3. Gastos por categoría.
4. Flujo de caja del período.
5. Comparación mensual.
6. Categorías excedidas.
7. Gastos no presupuestados.
8. Próximos pagos.
9. Consultas optimizadas y proyectadas a DTO.
10. Índices de base de datos revisados.
11. Logging y auditoría final.
12. Rate limiting donde corresponda.
13. Pruebas de integración end-to-end de API.
14. Documentación técnica.
15. Configuración de producción.
16. Publicación para IIS/Kestrel.
17. Procedimiento controlado de migración y rollback.

### Frontend

Implementar:

1. Dashboard del período.
2. Tarjetas de resumen financiero.
3. Progreso por categoría.
4. Tabla de categorías excedidas.
5. Gráficos accesibles y simples.
6. Comparación con mes anterior.
7. Historial mensual.
8. Reportes filtrables.
9. Exportación a Excel.
10. Página 404.
11. Página 403.
12. Error boundary.
13. Lazy loading por rutas cuando aporte valor.
14. Revisión de rendimiento.
15. Revisión WCAG 2.2 AA.
16. Build de producción.
17. Configuración de fallback SPA para IIS u otro hosting.

### Criterios de aceptación

- El panel utiliza datos reales calculados por backend.
- Todos los indicadores muestran período y significado.
- Los reportes respetan hogar, permisos y filtros.
- Las exportaciones contienen únicamente columnas autorizadas.
- El sistema permite comparar meses.
- No existen consultas N+1 evidentes.
- Los endpoints de alto volumen son paginados.
- Se valida autenticación y autorización.
- Se ejecutan pruebas críticas.
- `dotnet build`, `dotnet test`, `npm run lint` y `npm run build` finalizan correctamente.
- Existe documentación de despliegue.
- No hay secretos en el repositorio.
- El MVP puede publicarse en un ambiente de producción.

### Entregable final

Entregar:

- Resumen funcional.
- Arquitectura final.
- Modelo de datos.
- Migraciones.
- Tabla de endpoints.
- Roles y permisos.
- Variables de entorno.
- Guía de ejecución local.
- Guía de despliegue.
- Estrategia de respaldo de SQL Server.
- Procedimiento de migración.
- Procedimiento de rollback.
- Resultados de pruebas.
- Riesgos pendientes.
- Backlog posterior al MVP.

---

## 17. Estrategia de pruebas

## 17.1 Backend

Pruebas unitarias para:

- Cálculo de ingresos.
- Cálculo de presupuesto.
- Disponible por categoría.
- Gasto confirmado, pendiente y anulado.
- Presupuesto superior al ingreso.
- Generación idempotente de recurrentes.
- Período cerrado.
- Anulación.
- Permisos por hogar.
- Reglas de pertenencia.

Pruebas de integración para:

- Registro e inicio de sesión.
- Creación de hogar.
- Creación de período.
- Registro de ingreso.
- Creación de presupuesto.
- Registro de gasto.
- Cierre de período.
- Acceso no autorizado.
- Recurso de otro hogar.
- Duplicidad.
- Códigos HTTP.
- Contratos JSON.

## 17.2 Frontend

Cubrir:

- Renderizado.
- Formularios.
- Errores por campo.
- Estados de carga y vacío.
- Navegación protegida.
- Roles y permisos.
- Advertencias presupuestarias.
- Registro rápido de gasto.
- Filtros.
- Responsividad.
- Accesibilidad básica.

Flujos end-to-end:

1. Registrar usuario.
2. Crear hogar.
3. Abrir período.
4. Registrar salario e ingreso extra.
5. Configurar gastos fijos.
6. Crear presupuesto.
7. Registrar compras y pagos.
8. Consultar panel.
9. Exportar reporte.
10. Cerrar período.

---

## 18. Rendimiento

Backend:

- `AsNoTracking()` en consultas de lectura.
- Proyección directa a DTO.
- Paginación.
- Evitar N+1.
- Índices alineados con consultas.
- `CancellationToken`.
- No cargar tablas completas.
- Consultas agregadas en servidor.

Frontend:

- Lazy loading por rutas.
- Importaciones específicas.
- Debounce en búsquedas.
- Cancelación de solicitudes.
- Claves estables.
- Evitar memoización mecánica.
- Optimizar tablas y gráficos.
- Medir bundle.
- Validar Core Web Vitals en dispositivos de gama media.

---

## 19. Despliegue

### Backend

Ejecutar:

```powershell
dotnet restore
dotnet build -c Release
dotnet test -c Release
dotnet publish -c Release
```

Preparar:

- IIS o reverse proxy.
- HTTPS.
- Forwarded headers.
- Variables de entorno.
- Permisos mínimos.
- Acceso a SQL Server.
- Migraciones controladas.
- Logs.
- Health check.
- Rollback.

### Frontend

Ejecutar:

```bash
npm install
npm run lint
npm run build
```

Artefacto:

```text
dist/
```

Configurar:

- `VITE_API_BASE_URL`.
- Fallback SPA.
- Caché de assets versionados.
- `index.html` con caché controlada.
- Compresión.
- Encabezados de seguridad.
- HTTPS.
- CORS compatible con el backend.

---

## 20. Documentación requerida

Crear y mantener:

```text
README.md
Documentation/Architecture.md
Documentation/BusinessRules.md
Documentation/DataModel.md
Documentation/ApiEndpoints.md
Documentation/RolesAndPermissions.md
Documentation/EnvironmentVariables.md
Documentation/DeploymentGuide.md
Documentation/SecurityChecklist.md
Documentation/TestPlan.md
```

No documentes funcionalidades que no estén implementadas.

---

## 21. Forma de trabajo del asistente de código

Antes de modificar:

1. Inspecciona el repositorio.
2. Identifica si frontend y backend ya existen.
3. Revisa dependencias y versiones.
4. Ejecuta compilación inicial si es posible.
5. Registra errores preexistentes.
6. Define el alcance exacto de la fase.
7. Presenta decisiones técnicas.
8. Implementa únicamente la fase solicitada.

Cuando una ambigüedad bloquee una decisión correcta, pregunta con opciones seleccionables:

```text
Pregunta: ¿Qué comportamiento debe aplicarse?

A. Opción A
B. Opción B
C. Opción C
D. Otro: describir
```

Máximo cinco preguntas por bloque.

No vuelvas a preguntar información ya definida en este documento o disponible en el repositorio.

---

## 22. Formato obligatorio de respuesta durante el desarrollo

```markdown
# Resultado de la fase

## 1. Análisis
<estado actual y alcance>

## 2. Decisiones técnicas
<decisiones y justificación>

## 3. Reglas de negocio implementadas
<lista verificable>

## 4. Archivos creados
- ruta/archivo

## 5. Archivos modificados
- ruta/archivo

## 6. Base de datos
<entidades, relaciones, índices y migraciones>

## 7. API
| Método | Ruta | Permiso | Descripción |
|---|---|---|---|

## 8. Frontend
<vistas, rutas, componentes y estados>

## 9. Seguridad
<controles aplicados>

## 10. Pruebas y validaciones
- [ ] dotnet restore
- [ ] dotnet build
- [ ] dotnet test
- [ ] migraciones revisadas
- [ ] npm run lint
- [ ] npm run build
- [ ] responsividad
- [ ] accesibilidad
- [ ] integración API

## 11. Ejecución
<comandos y variables>

## 12. Pendientes o riesgos
<únicamente pendientes reales>
```

No marques una validación como completada si no fue ejecutada.

---

## 23. Definition of Done general

Una fase se considera terminada únicamente cuando:

- Cumple sus criterios de aceptación.
- Backend y frontend mantienen el stack definido.
- La solución compila.
- Las pruebas aplicables pasan.
- Los endpoints utilizan DTOs.
- Las reglas de negocio están en servicios.
- Las operaciones están autorizadas.
- Se valida pertenencia al hogar.
- Los importes usan `decimal`.
- Los cálculos autoritativos se ejecutan en backend.
- Los errores no exponen detalles internos.
- La UI maneja carga, error, vacío y éxito.
- La UI es responsiva.
- La UI es navegable por teclado.
- El período cerrado es protegido.
- Los cambios relevantes quedan auditados.
- Las migraciones fueron revisadas.
- No se versionaron secretos.
- La documentación fue actualizada.
- Los pendientes reales fueron declarados.

---

## 24. Fuera del alcance inicial del MVP

No implementar automáticamente en las cuatro fases, salvo solicitud expresa:

- Conexión bancaria automática.
- Sincronización con tarjetas.
- Open Banking.
- Lectura OCR de facturas.
- Inteligencia artificial para recomendar gastos.
- Multi-moneda con conversión.
- Contabilidad de partida doble.
- Declaraciones fiscales.
- Inversiones.
- Préstamos entre usuarios.
- Notificaciones push.
- Aplicación móvil nativa.
- Cobros o pagos en línea.
- Importación masiva desde bancos.
- Almacenamiento de comprobantes.
- Presupuestos anuales complejos.

Diseña la arquitectura para permitir evolución futura sin sobreingeniería.

---

## 25. Instrucción de inicio

Comienza trabajando exclusivamente en la **Fase 1**.

Antes de generar código:

1. Resume el estado del repositorio.
2. Confirma las versiones detectadas.
3. Identifica archivos y proyectos existentes.
4. Señala errores preexistentes.
5. Presenta el diseño técnico de la Fase 1.
6. Indica las migraciones previstas.
7. Lista los endpoints y pantallas a implementar.
8. Formula únicamente preguntas verdaderamente bloqueantes.

Después implementa la Fase 1 de forma completa, ejecuta las validaciones disponibles y entrega el checkpoint definido.

No avances a otra fase dentro de la misma ejecución salvo que la Fase 1 esté terminada y se solicite expresamente continuar.
