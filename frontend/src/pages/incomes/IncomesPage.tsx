import { useEffect, useState } from 'react'
import {
  Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem,
  Paper, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography,
} from '@mui/material'
import { useAppContext } from '../../context/AppContext'
import { incomesApi } from '../../api/incomes.api'
import type { Income, IncomeType } from '../../types/domain'
import { EmptyState, ErrorState, LoadingState, PageHeader } from '../../components/ui/States'
import { formatCurrency } from '../../utils/currency'
import { todayIso } from '../../utils/dates'
import { getErrorMessage } from '../../utils/getErrorMessage'
import { IncomeStatus, PeriodStatus } from '../../types/domain'
import { incomeStatusLabel } from '../../utils/labels'

export default function IncomesPage() {
  const { activeHousehold, activePeriod } = useAppContext()
  const [types, setTypes] = useState<IncomeType[]>([])
  const [items, setItems] = useState<Income[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ incomeTypeId: 0, description: '', estimatedAmount: 0, expectedDate: todayIso(), sourcePerson: '', isRecurring: false, notes: '' })

  const readonly = activePeriod?.status === PeriodStatus.Closed

  const load = async () => {
    if (!activeHousehold || !activePeriod) return
    setLoading(true)
    setError('')
    try {
      const [incomeTypes, incomes] = await Promise.all([
        incomesApi.types(),
        incomesApi.list(activeHousehold.id, activePeriod.id),
      ])
      setTypes(incomeTypes)
      setItems(incomes)
      if (incomeTypes[0]) setForm((f) => ({ ...f, incomeTypeId: incomeTypes[0].id }))
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [activeHousehold?.id, activePeriod?.id])

  const handleCreate = async () => {
    if (!activeHousehold || !activePeriod) return
    try {
      await incomesApi.create(activeHousehold.id, activePeriod.id, form)
      setOpen(false)
      await load()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const handleReceive = async (income: Income) => {
    if (!activeHousehold) return
    try {
      await incomesApi.receive(activeHousehold.id, income.id, income.estimatedAmount, todayIso())
      await load()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  if (!activeHousehold || !activePeriod) return <EmptyState title="Seleccione hogar y período" />
  if (loading) return <LoadingState />
  if (error && items.length === 0) return <ErrorState message={error} onRetry={() => void load()} />

  const totalEstimated = items.filter((i) => i.status !== IncomeStatus.Cancelled).reduce((s, i) => s + i.estimatedAmount, 0)
  const totalReceived = items.filter((i) => i.status === IncomeStatus.Received).reduce((s, i) => s + i.receivedAmount, 0)

  return (
    <>
      <PageHeader
        title="Ingresos del mes"
        action={!readonly ? <Button variant="contained" onClick={() => setOpen(true)}>Nuevo ingreso</Button> : undefined}
      />
      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography>Estimado: {formatCurrency(totalEstimated)} · Recibido: {formatCurrency(totalReceived)}</Typography>
      </Paper>
      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Tipo</TableCell>
              <TableCell>Descripción</TableCell>
              <TableCell align="right">Estimado</TableCell>
              <TableCell align="right">Recibido</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((income) => (
              <TableRow key={income.id}>
                <TableCell>{income.incomeTypeName}</TableCell>
                <TableCell>{income.description}</TableCell>
                <TableCell align="right">{formatCurrency(income.estimatedAmount)}</TableCell>
                <TableCell align="right">{formatCurrency(income.receivedAmount)}</TableCell>
                <TableCell>{incomeStatusLabel(income.status)}</TableCell>
                <TableCell align="right">
                  {!readonly && income.status === IncomeStatus.Pending ? (
                    <Button size="small" onClick={() => void handleReceive(income)}>Marcar recibido</Button>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Nuevo ingreso</DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 2, pt: 1 }}>
          <TextField select label="Tipo" value={form.incomeTypeId} onChange={(e) => setForm({ ...form, incomeTypeId: Number(e.target.value) })}>
            {types.map((t) => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}
          </TextField>
          <TextField label="Descripción" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <TextField label="Monto estimado" type="number" value={form.estimatedAmount} onChange={(e) => setForm({ ...form, estimatedAmount: Number(e.target.value) })} />
          <TextField label="Fecha esperada" type="date" slotProps={{ inputLabel: { shrink: true } }} value={form.expectedDate} onChange={(e) => setForm({ ...form, expectedDate: e.target.value })} />
          <TextField label="Fuente / persona" value={form.sourcePerson} onChange={(e) => setForm({ ...form, sourcePerson: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={() => void handleCreate()}>Guardar</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
