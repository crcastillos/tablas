import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Alert, Box, Button, Typography } from '@mui/material'

interface Props { children: ReactNode }
interface State { hasError: boolean }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 4 }}>
          <Alert severity="error" sx={{ mb: 2 }}>Ocurrió un error inesperado en la aplicación.</Alert>
          <Typography sx={{ mb: 2 }}>Intente recargar la página o regrese al inicio.</Typography>
          <Button variant="contained" onClick={() => window.location.assign('/')}>Ir al inicio</Button>
        </Box>
      )
    }
    return this.props.children
  }
}
