import { Box, Button, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <Box sx={{ p: 4, textAlign: 'center' }}>
      <Typography variant="h4" gutterBottom>404 — Página no encontrada</Typography>
      <Typography sx={{ mb: 2 }}>La ruta solicitada no existe.</Typography>
      <Button component={RouterLink} to="/" variant="contained">Volver al inicio</Button>
    </Box>
  )
}
