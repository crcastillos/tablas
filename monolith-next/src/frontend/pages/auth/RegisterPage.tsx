"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Alert, Box, Button, Link as MuiLink, Paper, TextField, Typography } from "@mui/material";
import { useAuth } from "@/frontend/context/AuthContext";
import { getErrorMessage } from "@/frontend/utils/getErrorMessage";

export default function RegisterPage() {
  const { user, register } = useAuth();
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) router.replace("/");
  }, [user, router]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await register(email, password, displayName);
      router.replace("/");
    } catch (err) {
      setError(getErrorMessage(err, "No se pudo registrar la cuenta."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", p: 2 }}>
      <Paper sx={{ p: 4, width: "100%", maxWidth: 420 }} component="form" onSubmit={handleSubmit}>
        <Typography variant="h5" sx={{ mb: 2 }}>Crear cuenta</Typography>
        {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
        <TextField label="Nombre" fullWidth required margin="normal" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        <TextField label="Correo" type="email" fullWidth required margin="normal" value={email} onChange={(e) => setEmail(e.target.value)} />
        <TextField
          label="Contrasena"
          type="password"
          fullWidth
          required
          margin="normal"
          helperText="Minimo 8 caracteres, mayuscula, minuscula y numero"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }} disabled={submitting}>
          Registrarse
        </Button>
        <Typography sx={{ mt: 2, textAlign: "center" }}>
          Ya tiene cuenta? <MuiLink component={Link} href="/login">Iniciar sesion</MuiLink>
        </Typography>
      </Paper>
    </Box>
  );
}
