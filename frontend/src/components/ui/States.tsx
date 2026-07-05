import { Alert, Box, CircularProgress, Typography } from '@mui/material'

export function LoadingState({ label = 'Cargando…' }: { label?: string }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 200, gap: 2 }}>
      <CircularProgress aria-label={label} />
      <Typography color="text.secondary">{label}</Typography>
    </Box>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Alert severity="error" action={onRetry ? <button type="button" onClick={onRetry}>Reintentar</button> : undefined}>
      {message}
    </Alert>
  )
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <Box sx={{ textAlign: 'center', py: 6 }}>
      <Typography variant="h6">{title}</Typography>
      {description ? <Typography color="text.secondary" sx={{ mt: 1 }}>{description}</Typography> : null}
    </Box>
  )
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
      <Box>
        <Typography variant="h4" component="h1">{title}</Typography>
        {subtitle ? <Typography color="text.secondary">{subtitle}</Typography> : null}
      </Box>
      {action}
    </Box>
  )
}

export function FinancialSummaryCard({ label, value, helper }: { label: string; value: string; helper?: string }) {
  return (
    <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'background.paper', boxShadow: 1 }}>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="h5" component="p" sx={{ mt: 0.5 }}>{value}</Typography>
      {helper ? <Typography variant="caption" color="text.secondary">{helper}</Typography> : null}
    </Box>
  )
}

export function BudgetProgress({ label, percentage }: { label: string; percentage: number }) {
  const color = percentage > 100 ? 'error.main' : percentage >= 80 ? 'warning.main' : 'success.main'
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="body2">{label}</Typography>
        <Typography variant="body2">{percentage.toFixed(1)}%</Typography>
      </Box>
      <Box sx={{ height: 8, bgcolor: 'grey.200', borderRadius: 4, overflow: 'hidden' }}>
        <Box sx={{ width: `${Math.min(percentage, 100)}%`, height: '100%', bgcolor: color }} />
      </Box>
    </Box>
  )
}

export function StatusChip({ label, tone = 'default' }: { label: string; tone?: 'default' | 'success' | 'warning' | 'error' }) {
  const colors = {
    default: 'grey.300',
    success: 'success.light',
    warning: 'warning.light',
    error: 'error.light',
  }
  return (
    <Box component="span" sx={{ px: 1, py: 0.25, borderRadius: 1, bgcolor: colors[tone], fontSize: 12 }}>
      {label}
    </Box>
  )
}
