"use client";

import Link from "next/link";
import { Box, Button, Typography } from "@mui/material";

export default function NotFound() {
  return (
    <Box sx={{ p: 4, textAlign: "center" }}>
      <Typography variant="h4" gutterBottom>404 - Pagina no encontrada</Typography>
      <Typography sx={{ mb: 2 }}>La ruta solicitada no existe.</Typography>
      <Button component={Link} href="/" variant="contained">Volver al inicio</Button>
    </Box>
  );
}
