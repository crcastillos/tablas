"use client";

import React from "react";
import {
  Box,
  Typography,
  Container,
  Paper,
  Stack,
  Chip,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import Image from "next/image";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#F9FAFB", // Tailwind gray-50
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        py: { xs: 6, md: 12 },
        px: 2,
      }}
    >
      <Container maxWidth="sm">
        {/* Logo and Branding */}
        <Box sx={{ textAlign: "center", mb: 6 }}>
          <Box sx={{ display: "inline-flex", mb: 3 }}>
            <Image
              src="/logo-tablas-app.png"
              alt="TABLAS logo"
              width={220}
              height={72}
              style={{ height: "auto", objectFit: "contain" }}
            />
          </Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              color: "#111827", // Tailwind gray-900
              letterSpacing: "-0.025em",
              mb: 1,
            }}
          >
            Entiende. Planifica. <Box component="span" sx={{ color: "#059669" }}>Crece.</Box>
          </Typography>
          <Typography
            variant="body1"
            sx={{ color: "#4B5563", maxWidth: 480, mx: "auto" }} // Tailwind gray-600
          >
            El sistema profesional para la gestión financiera de tu familia.
          </Typography>
        </Box>

        {/* Auth Card */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 4, md: 6 },
            borderRadius: 4,
            border: "1px solid #E5E7EB", // Tailwind gray-200
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)", // Tailwind shadow-md
            bgcolor: "white",
          }}
        >
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="h5"
              sx={{ fontWeight: 700, color: "#111827", mb: 1 }}
            >
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" sx={{ color: "#6B7280" }}>
                {subtitle}
              </Typography>
            )}
          </Box>

          {children}
        </Paper>

        {/* Trust / Value Section (from PDF) */}
        <Box sx={{ mt: 8, textAlign: "center" }}>
          <Typography
            variant="caption"
            sx={{
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              fontWeight: 700,
              color: "#9CA3AF", // Tailwind gray-400
              display: "block",
              mb: 3,
            }}
          >
            Certeza financiera mensual
          </Typography>
          
          <Stack
            direction="row"
            spacing={1.5}
            useFlexGap
            sx={{ mb: 4, justifyContent: "center", flexWrap: "wrap" }}
          >
            {["Existente", "Comprometido", "Reservado", "Disponible"].map((label) => (
              <Chip
                key={label}
                label={label}
                size="small"
                sx={{
                  bgcolor: "white",
                  border: "1px solid #E5E7EB",
                  color: "#374151",
                  fontWeight: 500,
                  fontSize: "0.75rem",
                }}
              />
            ))}
          </Stack>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={4}
            sx={{ opacity: 0.7, justifyContent: "center", alignItems: "center" }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <AccountBalanceWalletIcon sx={{ color: "#4B5563", fontSize: 20 }} />
              <Typography variant="caption" sx={{ fontWeight: 600, color: "#4B5563" }}>
                Gestión Inteligente
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <NotificationsActiveIcon sx={{ color: "#4B5563", fontSize: 20 }} />
              <Typography variant="caption" sx={{ fontWeight: 600, color: "#4B5563" }}>
                Alertas Oportunas
              </Typography>
            </Box>
          </Stack>
        </Box>

        {/* Footer */}
        <Box sx={{ mt: 10, textAlign: "center" }}>
          <Typography variant="caption" sx={{ color: "#9CA3AF" }}>
            tablas © 2026 · Privacidad y Seguridad Garantizada
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};
