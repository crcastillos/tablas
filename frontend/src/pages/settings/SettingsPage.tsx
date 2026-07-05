import { useState } from 'react'
import { Alert, Box, Button, Paper, TextField, Typography } from '@mui/material'
import { useAppContext } from '../../context/AppContext'
import { PageHeader } from '../../components/ui/States'
import { getErrorMessage } from '../../utils/getErrorMessage'

export default function SettingsPage() {
  const { activeHousehold, households, createHousehold, setActiveHousehold } = useAppContext()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const handleCreate = async () => {
    setError('')
    setMessage('')
    try {
      const household = await createHousehold(name, description || undefined)
      setMessage(`Hogar "${household.name}" creado.`)
      setName('')
      setDescription('')
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  return (
    <>
      <PageHeader title="Configuración" subtitle="Administre hogares y preferencias básicas." />
      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
      {message ? <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert> : null}

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Crear hogar</Typography>
        <Box sx={{ display: 'grid', gap: 2, maxWidth: 480 }}>
          <TextField label="Nombre del hogar" value={name} onChange={(e) => setName(e.target.value)} />
          <TextField label="Descripción" value={description} onChange={(e) => setDescription(e.target.value)} />
          <Button variant="contained" onClick={() => void handleCreate()} disabled={!name.trim()}>Crear hogar</Button>
        </Box>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Hogares disponibles</Typography>
        {households.map((household) => (
          <Box key={household.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1, borderBottom: '1px solid #eee' }}>
            <Box>
              <Typography>{household.name}</Typography>
              <Typography variant="caption" color="text.secondary">{household.currencyCode} · {household.timeZoneId}</Typography>
            </Box>
            <Button size="small" variant={activeHousehold?.id === household.id ? 'contained' : 'outlined'} onClick={() => setActiveHousehold(household)}>
              {activeHousehold?.id === household.id ? 'Activo' : 'Seleccionar'}
            </Button>
          </Box>
        ))}
      </Paper>
    </>
  )
}
