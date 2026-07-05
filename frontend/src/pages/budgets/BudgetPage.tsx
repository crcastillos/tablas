import { useEffect, useState } from 'react'
import {
  Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  Paper, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography,
} from '@mui/material'
import { useAppContext } from '../../context/AppContext'
import { budgetsApi, categoriesApi } from '../../api/budgets.api'
import type { BudgetSummary, ExpenseCategory } from '../../types/domain'
import { BudgetProgress, EmptyState, ErrorState, LoadingState, PageHeader } from '../../components/ui/States'
import { formatCurrency } from '../../utils/currency'
import { getErrorMessage } from '../../utils/getErrorMessage'
import { PeriodStatus } from '../../types/domain'

export default function BudgetPage() {
  const { activeHousehold, activePeriod } = useAppContext()
  const [categories, setCategories] = useState<ExpenseCategory[]>([])
  const [budget, setBudget] = useState<BudgetSummary | null>(null)
  const [amounts, setAmounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)

  const readonly = activePeriod?.status === PeriodStatus.Closed

  const load = async () => {
    if (!activeHousehold || !activePeriod) return
    setLoading(true)
    setError('')
    try {
      const [cats, summary] = await Promise.all([
        categoriesApi.list(activeHousehold.id),
        budgetsApi.get(activeHousehold.id, activePeriod.id),
      ])
      setCategories(cats.filter((c) => c.isActive))
      setBudget(summary)
      const map: Record<string, number> = {}
      summary.lines.forEach((line) => { map[line.categoryId] = line.budgetedAmount })
      cats.forEach((c) => { if (map[c.id] === undefined) map[c.id] = 0 })
      setAmounts(map)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [activeHousehold?.id, activePeriod?.id])

  const save = async (confirmExceedsIncome = false) => {
    if (!activeHousehold || !activePeriod) return
    try {
      const lines = categories.map((c) => ({ categoryId: c.id, budgetedAmount: amounts[c.id] ?? 0, notes: null }))
      const result = await budgetsApi.upsert(activeHousehold.id, activePeriod.id, {
        lines,
        confirmExceedsIncome,
        rowVersion: budget?.rowVersion ?? null,
      })
      setBudget(result)
      setConfirmOpen(false)
    } catch (err) {
      const message = getErrorMessage(err)
      if (message.toLowerCase().includes('excede') || message.toLowerCase().includes('ingreso')) setConfirmOpen(true)
      else setError(message)
    }
  }

  const generateFromRecurring = async () => {
    if (!activeHousehold || !activePeriod) return
    try {
      setBudget(await budgetsApi.generateFromRecurring(activeHousehold.id, activePeriod.id))
      await load()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  if (!activeHousehold || !activePeriod) return <EmptyState title="Seleccione hogar y período" />
  if (loading) return <LoadingState />
  if (error && !budget) return <ErrorState message={error} onRetry={() => void load()} />

  return (
    <>
      <PageHeader
        title="Presupuesto mensual"
        subtitle={budget ? `Asignado ${budget.assignedPercentage.toFixed(1)}% del ingreso estimado` : undefined}
        action={
          !readonly ? (
            <>
              <Button sx={{ mr: 1 }} onClick={() => void generateFromRecurring()}>Desde gastos fijos</Button>
              <Button variant="contained" onClick={() => void save()}>Guardar presupuesto</Button>
            </>
          ) : undefined
        }
      />
      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
      {budget?.exceedsIncome ? <Alert severity="warning" sx={{ mb: 2 }}>El presupuesto supera el ingreso estimado.</Alert> : null}

      {budget ? (
        <Paper sx={{ p: 2, mb: 2, display: 'grid', gap: 2, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          <Typography>Ingreso estimado: {formatCurrency(budget.totalEstimatedIncome)}</Typography>
          <Typography>Presupuestado: {formatCurrency(budget.totalBudgeted)}</Typography>
          <Typography>Gastado: {formatCurrency(budget.totalSpent)}</Typography>
          <Typography>Saldo presupuestario: {formatCurrency(budget.budgetBalance)}</Typography>
        </Paper>
      ) : null}

      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Categoría</TableCell>
              <TableCell align="right">Presupuesto</TableCell>
              <TableCell align="right">Gastado</TableCell>
              <TableCell>Consumo</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {categories.map((category) => {
              const line = budget?.lines.find((l) => l.categoryId === category.id)
              return (
                <TableRow key={category.id}>
                  <TableCell>{category.name}</TableCell>
                  <TableCell align="right">
                    {readonly ? formatCurrency(amounts[category.id] ?? 0) : (
                      <TextField
                        type="number"
                        size="small"
                        value={amounts[category.id] ?? 0}
                        onChange={(e) => setAmounts({ ...amounts, [category.id]: Number(e.target.value) })}
                        slotProps={{ htmlInput: { min: 0, step: 0.01, style: { textAlign: 'right' } } }}
                      />
                    )}
                  </TableCell>
                  <TableCell align="right">{formatCurrency(line?.spentAmount ?? 0)}</TableCell>
                  <TableCell><BudgetProgress label="" percentage={line?.consumedPercentage ?? 0} /></TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Confirmar exceso de presupuesto</DialogTitle>
        <DialogContent>
          <Typography>El presupuesto total supera el ingreso estimado. ¿Desea continuar?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={() => void save(true)}>Confirmar y guardar</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
