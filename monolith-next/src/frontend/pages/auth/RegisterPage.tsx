"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Alert, Box, Button, TextField, InputAdornment, IconButton, Link as MuiLink, Typography, Stack } from "@mui/material";
import { useAuth } from "@/frontend/context/AuthContext";
import { getErrorMessage } from "@/frontend/utils/getErrorMessage";
import { AuthLayout } from "@/frontend/components/auth/AuthLayout";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

export default function RegisterPage() {
  const { user, register } = useAuth();
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
      await register(email, password, displayName);
      router.replace("/");
    } catch (err) {
      setError(getErrorMessage(err, "No se pudo crear la cuenta."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Crear cuenta"
      subtitle="Comienza a gestionar tu certeza financiera familiar."
    >
      <Box component="form" onSubmit={handleSubmit} sx={{ width: "100%" }}>
        {error ? (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 1.5, fontSize: "0.875rem" }}>
            {error}
          </Alert>
        ) : null}
        
        <Stack spacing={2.5}>
          <TextField
            label="Nombre completo"
            fullWidth
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            variant="outlined"
            placeholder="Tu nombre"
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 1.5,
                bgcolor: "#F9FAFB",
                "&:hover": { bgcolor: "white" },
                "&.Mui-focused": { bgcolor: "white" },
              }
            }}
          />
          
          <TextField
            label="Correo electrónico"
            type="email"
            fullWidth
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            variant="outlined"
            placeholder="nombre@ejemplo.com"
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 1.5,
                bgcolor: "#F9FAFB",
                "&:hover": { bgcolor: "white" },
                "&.Mui-focused": { bgcolor: "white" },
              }
            }}
          />
          
          <TextField
            label="Contraseña"
            type={showPassword ? "text" : "password"}
            fullWidth
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            variant="outlined"
            placeholder="Mínimo 8 caracteres"
            slotProps={{
              inputLabel: { shrink: true },
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      size="small"
                    >
                      {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
            helperText="Usa mayúsculas, minúsculas y números."
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 1.5,
                bgcolor: "#F9FAFB",
                "&:hover": { bgcolor: "white" },
                "&.Mui-focused": { bgcolor: "white" },
              }
            }}
          />
          
          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={submitting}
            sx={{
              py: 1.8,
              fontSize: "0.95rem",
              fontWeight: 600,
              textTransform: "none",
              borderRadius: 1.5,
              bgcolor: "#2563EB", // Tailwind blue-600
              boxShadow: "none",
              "&:hover": {
                bgcolor: "#1D4ED8", // Tailwind blue-700
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
              },
            }}
          >
            {submitting ? "Creando cuenta..." : "Registrarse gratis"}
          </Button>
        </Stack>

        <Box sx={{ mt: 4, textAlign: "center" }}>
          <Typography variant="body2" sx={{ color: "#6B7280" }}>
            ¿Ya tienes una cuenta?{" "}
            <MuiLink
              component={Link}
              href="/login"
              sx={{
                fontWeight: 600,
                color: "#2563EB",
                textDecoration: "none",
                "&:hover": { textDecoration: "underline" },
              }}
            >
              Inicia sesión
            </MuiLink>
          </Typography>
        </Box>
      </Box>
    </AuthLayout>
  );
}
