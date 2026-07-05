"use client";

import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";

import { CssBaseline, ThemeProvider } from "@mui/material";
import { AuthProvider } from "@/frontend/context/AuthContext";
import { AppProvider } from "@/frontend/context/AppContext";
import { ErrorBoundary } from "@/frontend/components/ErrorBoundary";
import { theme } from "@/frontend/theme/theme";

export default function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorBoundary>
        <AuthProvider>
          <AppProvider>{children}</AppProvider>
        </AuthProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}
