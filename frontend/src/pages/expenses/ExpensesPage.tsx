import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem,
  Paper, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography,
} from '@mui/material'
import { useAppContext } from '../../context/AppContext'
import { categoriesApi } from '../../api/budgets.api'
import { expensesApi } from '../../api/expenses.api'
import type { Expense, ExpenseCategory } from '../../types/domain'
import { EmptyState, ErrorState, LoadingState, PageHeader } from '../../components/ui/States'
import { formatCurrency } from '../../utils/currency'
import { formatDate, todayIso } from '../../utils/dates'
import { getErrorMessage } from '../../utils/getErrorMessage'
import { ExpenseMovementType, ExpenseStatus, PaymentMethodType, PeriodStatus } from '../../types/domain'
import { expenseStatusLabel, paymentMethodOptions } from '../../utils/labels'

export default function ExpensesPage() {
  const { activeHousehold, activePeriod } = useAppContext()
  const [searchParams, setSearchParams] = useSearchParams()
  const [categories, setCategories] = useState<ExpenseCategory[]>([])
  const [items, setItems] = useState<Expense[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(searchParams.get('quick') === '1')
  const [confirmExceeded, setConfirmExceeded] = useState(false)
  const [confirmUnbudgeted, setConfirmUnbudgeted] = useState(false)
  const [form, setForm] = useState<{
    categoryId: string
    movementType: ExpenseMovementType
    description: string
    amount: number
    movementDate: string
    paymentMethod: PaymentMethodType
    merchantOrPayee: string
    referenceNumber: string
    notes: string
    idempotencyKey: string
  }>({
    categoryId: '',
    movementType: ExpenseMovementType.Purchase,
    description: '',
    amount: 0,
    movementDate: todayIso(),
    paymentMethod: PaymentMethodType.Cash as PaymentMethodType,
    merchantOrPayee: '',
    referenceNumber: '',
    notes: '',
    idempotencyKey: crypto.randomUUID(),
  })

  const readonly = activePeriod?.status === PeriodStatus.Closed

  const load = async () => {
    if (!activeHousehold || !activePeriod) return
    setLoading(true)
    setError('')
    try {
      const [cats, page] = await Promise.all([
        categoriesApi.list(activeHousehold.id),
        expensesApi.list(activeHousehold.id, activePeriod.id, { pageSize: 50 }),
      ])
      setCategories(cats.filter((c) => c.isActive))
      setItems(page.items)
      if (cats[0]) setForm((f) => ({ ...f, categoryId: cats[0].id }))
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [activeHousehold?.id, activePeriod?.id])

  const handleOpen = () => {
    setForm((f) => ({ ...f, idempotencyKey: crypto.randomUUID() }))
    setConfirmExceeded(false)
    setConfirmUnbudgeted(false)
    setOpen(true)
    setSearchParams({})
  }

  const submit = async () => {
    if (!activeHousehold || !activePeriod) return
    try {
      await expensesApi.create(activeHousehold.id, activePeriod.id, {
        ...form,
        confirmExceeded,
        confirmUnbudgeted,
        recurringExpenseId: null,
      })
      setOpen(false)
      await load()
    } catch (err) {
      const message = getErrorMessage(err)
      if (message.toLowerCase().includes('presupuesto')) setConfirmUnbudgeted(true)
      if (message.toLowerCase().includes('excede')) setConfirmExceeded(true)
      setError(message)
    }
  }

  const totals = useMemo(() => ({
    confirmed: items.filter((e) => e.status === ExpenseStatus.Confirmed).reduce((s, e) => s + e.amount, 0),
    pending: items.filter((e) => e.status === ExpenseStatus.Pending).reduce((s, e) => s + e.amount, 0),
  }), [items])

  if (!activeHousehold || !activePeriod) return <EmptyState title="Seleccione hogar y período" />
  if (loading) return <LoadingState />
  if (error && items.length === 0) return <ErrorState message={error} onRetry={() => void load()} />

  return (
    <>
      <PageHeader
        title="Gastos y pagos"
        action={!readonly ? <Button variant="contained" onClick={handleOpen}>Registrar gasto</Button> : undefined}
      />
      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography>Confirmados: {formatCurrency(totals.confirmed)} · Pendientes: {formatCurrency(totals.pending)}</Typography>
      </Paper>
      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Fecha</TableCell>
              <TableCell>Descripción</TableCell>
              <TableCell>Categoría</TableCell>
              <TableCell align="right">Monto</TableCell>
              <TableCell>Estado</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell>{formatDate(expense.movementDate)}</TableCell>
                <TableCell>{expense.description}</TableCell>
                <TableCell>{expense.categoryName}</TableCell>
                <TableCell align="right">{formatCurrency(expense.amount)}</TableCell>
                <TableCell>{expenseStatusLabel(expense.status)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Registrar gasto</DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 2, pt: 1 }}>
          <TextField select label="Categoría" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
            {categories.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
          </TextField>
          <TextField label="Descripción" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <TextField label="Monto" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
          <TextField label="Fecha" type="date" slotProps={{ inputLabel: { shrink: true } }} value={form.movementDate} onChange={(e) => setForm({ ...form, movementDate: e.target.value })} />
          <TextField select label="Método de pago" value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: Number(e.target.value) as PaymentMethodType })}>
            {paymentMethodOptions.map(([label, value]) => (
              <MenuItem key={value} value={value}>{label}</MenuItem>
            ))}
          </TextField>
          {(confirmUnbudgeted || confirmExceeded) ? (
            <Alert severity="warning">
              {confirmUnbudgeted ? 'La categoría no tiene presupuesto. ' : ''}
              {confirmExceeded ? 'El gasto excede el presupuesto. ' : ''}
              Confirme para continuar.
            </Alert>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={() => void submit()}>Guardar</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
