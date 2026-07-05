import { useEffect, useState } from 'react'
import {
  Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem,
  Paper, Table, TableBody, TableCell, TableHead, TableRow, TextField,
} from '@mui/material'
import { useAppContext } from '../../context/AppContext'
import { categoriesApi, recurringApi } from '../../api/budgets.api'
import type { ExpenseCategory, RecurringExpense } from '../../types/domain'
import { EmptyState, LoadingState, PageHeader } from '../../components/ui/States'
import { formatCurrency } from '../../utils/currency'
import { getErrorMessage } from '../../utils/getErrorMessage'
import { RecurrenceFrequency } from '../../types/domain'
import { todayIso } from '../../utils/dates'

export default function RecurringPage() {
  const { activeHousehold } = useAppContext()
  const [categories, setCategories] = useState<ExpenseCategory[]>([])
  const [items, setItems] = useState<RecurringExpense[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    categoryId: '',
    name: '',
    estimatedAmount: 0,
    expectedPaymentDay: 1,
    frequency: RecurrenceFrequency.Monthly,
    startDate: todayIso(),
    provider: '',
    autoGenerateInBudget: true,
  })

  const load = async () => {
    if (!activeHousehold) return
    setLoading(true)
    try {
      const [cats, recurring] = await Promise.all([
        categoriesApi.list(activeHousehold.id),
        recurringApi.list(activeHousehold.id),
      ])
      setCategories(cats.filter((c) => c.isActive))
      setItems(recurring)
      if (cats[0]) setForm((f) => ({ ...f, categoryId: cats[0].id }))
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [activeHousehold?.id])

  const handleCreate = async () => {
    if (!activeHousehold) return
    try {
      await recurringApi.create(activeHousehold.id, form)
      setOpen(false)
      await load()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  if (!activeHousehold) return <EmptyState title="Seleccione un hogar" />
  if (loading) return <LoadingState />

  return (
    <>
      <PageHeader title="Gastos fijos" action={<Button variant="contained" onClick={() => setOpen(true)}>Nuevo gasto fijo</Button>} />
      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Categoría</TableCell>
              <TableCell align="right">Monto</TableCell>
              <TableCell>Día</TableCell>
              <TableCell>Activo</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.categoryName}</TableCell>
                <TableCell align="right">{formatCurrency(item.estimatedAmount)}</TableCell>
                <TableCell>{item.expectedPaymentDay}</TableCell>
                <TableCell>{item.isActive ? 'Sí' : 'No'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Nuevo gasto fijo</DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 2, pt: 1 }}>
          <TextField select label="Categoría" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
            {categories.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
          </TextField>
          <TextField label="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <TextField label="Monto estimado" type="number" value={form.estimatedAmount} onChange={(e) => setForm({ ...form, estimatedAmount: Number(e.target.value) })} />
          <TextField label="Día de pago" type="number" value={form.expectedPaymentDay} onChange={(e) => setForm({ ...form, expectedPaymentDay: Number(e.target.value) })} />
          <TextField label="Proveedor" value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={() => void handleCreate()}>Guardar</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
