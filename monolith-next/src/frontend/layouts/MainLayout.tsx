"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  AppBar,
  Box,
  Button,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Select,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import DashboardIcon from "@mui/icons-material/Dashboard";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import RepeatIcon from "@mui/icons-material/Repeat";
import CategoryIcon from "@mui/icons-material/Category";
import AssessmentIcon from "@mui/icons-material/Assessment";
import GroupIcon from "@mui/icons-material/Group";
import SettingsIcon from "@mui/icons-material/Settings";
import LogoutIcon from "@mui/icons-material/Logout";
import AddIcon from "@mui/icons-material/Add";
import { useAuth } from "@/frontend/context/AuthContext";
import { useAppContext } from "@/frontend/context/AppContext";
import { formatMonthYear } from "@/frontend/utils/dates";
import { PeriodStatus } from "@/frontend/types/domain";
import ArielChatWidget from "@/frontend/components/ariel/ArielChatWidget";

const navItems = [
  { to: "/", label: "Inicio", icon: <DashboardIcon /> },
  { to: "/periods", label: "Periodo", icon: <CalendarMonthIcon /> },
  { to: "/incomes", label: "Ingresos", icon: <AttachMoneyIcon /> },
  { to: "/budget", label: "Presupuesto", icon: <AccountBalanceWalletIcon /> },
  { to: "/expenses", label: "Gastos", icon: <ReceiptLongIcon /> },
  { to: "/recurring", label: "Gastos fijos", icon: <RepeatIcon /> },
  { to: "/categories", label: "Categorias", icon: <CategoryIcon /> },
  { to: "/reports", label: "Reportes", icon: <AssessmentIcon /> },
  { to: "/members", label: "Integrantes", icon: <GroupIcon /> },
  { to: "/settings", label: "Configuracion", icon: <SettingsIcon /> },
];

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down("md"));
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { households, activeHousehold, setActiveHousehold, periods, activePeriod, setActivePeriod } = useAppContext();

  const handleLogout = () => {
    void logout().then(() => {
      router.push("/login");
    });
  };

  const drawer = (
    <Box sx={{ width: 260, display: "flex", flexDirection: "column", height: "100%" }} role="navigation" aria-label="Menu principal">
      <Box sx={{ p: 2 }}>
        <Typography variant="h6">Finanzas del Hogar</Typography>
        <Typography variant="caption" color="text.secondary">{user?.displayName}</Typography>
      </Box>
      <List sx={{ flex: 1 }}>
        {navItems.map((item) => (
          <ListItemButton key={item.to} component={Link} href={item.to} selected={pathname === item.to} onClick={() => setOpen(false)}>
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
      <ListItemButton onClick={handleLogout} aria-label="Salir">
        <ListItemIcon><LogoutIcon /></ListItemIcon>
        <ListItemText primary="Salir" />
      </ListItemButton>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <AppBar position="fixed" sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
        <Toolbar sx={{ gap: 2, flexWrap: "wrap" }}>
          {mobile ? (
            <IconButton color="inherit" edge="start" onClick={() => setOpen(true)} aria-label="Abrir menu">
              <MenuIcon />
            </IconButton>
          ) : null}
          <Typography variant="h6" sx={{ flexGrow: { xs: 1, md: 0 } }}>{process.env.NEXT_PUBLIC_APP_NAME ?? "Finanzas del Hogar"}</Typography>
          <Select
            size="small"
            value={activeHousehold?.id ?? ""}
            displayEmpty
            sx={{ minWidth: 160, bgcolor: "rgba(255,255,255,0.1)", color: "white", ".MuiOutlinedInput-notchedOutline": { border: 0 } }}
            onChange={(e) => {
              const household = households.find((h) => h.id === e.target.value) ?? null;
              setActiveHousehold(household);
            }}
          >
            <MenuItem value="" disabled>Hogar</MenuItem>
            {households.map((h) => <MenuItem key={h.id} value={h.id}>{h.name}</MenuItem>)}
          </Select>
          <Select
            size="small"
            value={activePeriod?.id ?? ""}
            displayEmpty
            sx={{ minWidth: 180, bgcolor: "rgba(255,255,255,0.1)", color: "white", ".MuiOutlinedInput-notchedOutline": { border: 0 } }}
            onChange={(e) => {
              const period = periods.find((p) => p.id === e.target.value) ?? null;
              setActivePeriod(period);
            }}
          >
            <MenuItem value="" disabled>Periodo</MenuItem>
            {periods.map((p) => (
              <MenuItem key={p.id} value={p.id}>
                {formatMonthYear(p.year, p.month)} {p.status === PeriodStatus.Closed ? "(Cerrado)" : ""}
              </MenuItem>
            ))}
          </Select>
          <IconButton color="inherit" aria-label="Registrar gasto rapido" onClick={() => {
            router.push("/expenses?quick=1");
          }}>
            <AddIcon />
          </IconButton>
          <Button color="inherit" startIcon={<LogoutIcon />} onClick={handleLogout} sx={{ ml: { xs: 0, md: "auto" } }} aria-label="Salir">
            Salir
          </Button>
        </Toolbar>
      </AppBar>
      {!mobile ? (
        <Drawer variant="permanent" sx={{ width: 260, "& .MuiDrawer-paper": { width: 260, boxSizing: "border-box", mt: 8 } }}>
          {drawer}
        </Drawer>
      ) : (
        <Drawer open={open} onClose={() => setOpen(false)}>{drawer}</Drawer>
      )}
      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 3 }, mt: 8, width: "100%" }}>
        {children}
      </Box>
      <ArielChatWidget />
    </Box>
  );
}
