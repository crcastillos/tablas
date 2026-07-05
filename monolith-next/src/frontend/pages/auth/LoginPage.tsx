"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Alert, Box, Button, Link as MuiLink, Paper, TextField, Typography } from "@mui/material";
import { useAuth } from "@/frontend/context/AuthContext";
import { getErrorMessage } from "@/frontend/utils/getErrorMessage";

export default function LoginPage() {
  const { user, login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      router.replace("/");
    }
  }, [user, router]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await login(email, password);
      router.replace("/");
    } catch (err) {
      setError(getErrorMessage(err, "No se pudo iniciar sesion."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", p: 2 }}>
      <Paper sx={{ p: 4, width: "100%", maxWidth: 420 }} component="form" onSubmit={handleSubmit}>
        <Typography variant="h5" sx={{ mb: 2 }}>Iniciar sesion</Typography>
        {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
        <TextField label="Correo" type="email" fullWidth required margin="normal" value={email} onChange={(e) => setEmail(e.target.value)} />
        <TextField label="Contrasena" type="password" fullWidth required margin="normal" value={password} onChange={(e) => setPassword(e.target.value)} />
        <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }} disabled={submitting}>
          Entrar
        </Button>
        <Typography sx={{ mt: 2, textAlign: "center" }}>
          No tiene cuenta? <MuiLink component={Link} href="/register">Registrarse</MuiLink>
        </Typography>
      </Paper>
    </Box>
  );
}
