# Plan de pruebas

## Automatizadas

### Unit tests (`HouseholdFinance.UnitTests`)

| Test | Ámbito |
|---|---|
| `FinancialCalculatorTests` | Fórmulas de ingreso, presupuesto, saldo, porcentajes |

Ejecución:

```powershell
dotnet test tests/HouseholdFinance.UnitTests -c Release
```

### Integration tests (`HouseholdFinance.IntegrationTests`)

| Test | Ámbito |
|---|---|
| `AuthIntegrationTests` | Registro, login, hogar, período |

Usa `WebApplicationFactory` con entorno `Testing` e InMemory DB.

Ejecución:

```powershell
dotnet test tests/HouseholdFinance.IntegrationTests -c Release
```

## Frontend

```powershell
cd frontend
npm run lint    # oxlint — warnings aceptables
npm run build   # tsc + vite build
```

## Manual (post-migración SQL)

### Fase 1
- [ ] Registro e inicio de sesión
- [ ] Crear hogar e integrante
- [ ] Crear/cerrar/reabrir período

### Fase 2
- [ ] Ingreso estimado → recibido
- [ ] Categoría personalizada
- [ ] Recurrente → generar presupuesto
- [ ] Advertencia presupuesto > ingreso

### Fase 3
- [ ] Gasto pendiente → confirmado → anulado
- [ ] Idempotency-Key (doble submit)
- [ ] Período cerrado bloquea altas

### Fase 4
- [ ] Dashboard con datos coherentes
- [ ] Reportes y exportación Excel
- [ ] Comparación mensual

## CI sugerido

```yaml
- dotnet restore && dotnet build -c Release && dotnet test -c Release
- cd frontend && npm ci && npm run lint && npm run build
```

## Cobertura actual

- Backend: calculadora + flujo auth/hogar/período.
- Gap conocido: integración de presupuesto, gastos y reportes (ampliar en iteraciones).
