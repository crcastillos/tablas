"use client";

import Link from "next/link";
import { Box, Button, Typography } from "@mui/material";

export default function ForbiddenRoute() {
  return (
    <Box sx={{ p: 4, textAlign: "center" }}>
      <Typography variant="h4" gutterBottom>403 - Acceso denegado</Typography>
      <Typography sx={{ mb: 2 }}>No tiene permisos para ver este recurso.</Typography>
      <Button component={Link} href="/" variant="contained">Volver al inicio</Button>
    </Box>
  );
}
