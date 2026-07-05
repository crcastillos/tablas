import { Box, Button, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'

export default function ForbiddenPage() {
  return (
    <Box sx={{ p: 4, textAlign: 'center' }}>
      <Typography variant="h4" gutterBottom>403 — Acceso denegado</Typography>
      <Typography sx={{ mb: 2 }}>No tiene permisos para ver este recurso.</Typography>
      <Button component={RouterLink} to="/" variant="contained">Volver al inicio</Button>
    </Box>
  )
}
