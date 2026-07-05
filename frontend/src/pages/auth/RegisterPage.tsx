import { useState } from 'react'
import { Link as RouterLink, Navigate } from 'react-router-dom'
import { Alert, Box, Button, Link, Paper, TextField, Typography } from '@mui/material'
import { useAuth } from '../../context/AuthContext'
import { getErrorMessage } from '../../utils/getErrorMessage'

export default function RegisterPage() {
  const { user, register } = useAuth()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (user) return <Navigate to="/" replace />

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await register(email, password, displayName)
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo registrar la cuenta.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
      <Paper sx={{ p: 4, width: '100%', maxWidth: 420 }} component="form" onSubmit={handleSubmit}>
        <Typography variant="h5" sx={{ mb: 2 }}>Crear cuenta</Typography>
        {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
        <TextField label="Nombre" fullWidth required margin="normal" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        <TextField label="Correo" type="email" fullWidth required margin="normal" value={email} onChange={(e) => setEmail(e.target.value)} />
        <TextField label="Contraseña" type="password" fullWidth required margin="normal" helperText="Mínimo 8 caracteres, mayúscula, minúscula y número" value={password} onChange={(e) => setPassword(e.target.value)} />
        <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }} disabled={submitting}>
          Registrarse
        </Button>
        <Typography sx={{ mt: 2, textAlign: 'center' }}>
          ¿Ya tiene cuenta? <Link component={RouterLink} to="/login">Iniciar sesión</Link>
        </Typography>
      </Paper>
    </Box>
  )
}
