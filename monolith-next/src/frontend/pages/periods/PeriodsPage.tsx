"use client";

import { useState } from "react";
import { Alert, Box, Button, MenuItem, Paper, TextField, Typography } from "@mui/material";
import { useAppContext } from "@/frontend/context/AppContext";
import { EmptyState, PageHeader, StatusChip } from "@/frontend/components/ui/States";
import { formatMonthYear } from "@/frontend/utils/dates";
import { PeriodStatus } from "@/frontend/types/domain";
import { getErrorMessage } from "@/frontend/utils/getErrorMessage";
import { canManagePeriods } from "@/frontend/utils/permissions";

export default function PeriodsPage() {
  const { activeHousehold, periods, activePeriod, createPeriod, closePeriod, reopenPeriod } = useAppContext();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  if (!activeHousehold) return <EmptyState title="Seleccione un hogar" />;
  const canManage = canManagePeriods(activeHousehold.role, true);

  const handleCreate = async () => {
    setError("");
    setMessage("");
    try {
      await createPeriod(year, month);
      setMessage("Periodo creado correctamente.");
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <>
      <PageHeader title="Periodos mensuales" subtitle="Gestione apertura, cierre y reapertura del mes." />
      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
      {message ? <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert> : null}
      {canManage ? (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Abrir nuevo periodo</Typography>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <TextField label="Ano" type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} />
            <TextField label="Mes" select value={month} onChange={(e) => setMonth(Number(e.target.value))} sx={{ minWidth: 160 }}>
              {Array.from({ length: 12 }, (_, i) => <MenuItem key={i + 1} value={i + 1}>{i + 1}</MenuItem>)}
            </TextField>
            <Button variant="contained" onClick={() => void handleCreate()}>Crear periodo</Button>
          </Box>
        </Paper>
      ) : null}

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Periodos del hogar</Typography>
        {periods.length === 0 ? <Typography color="text.secondary">No hay periodos registrados.</Typography> : null}
        {periods.map((period) => (
          <Box
            key={period.id}
            sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 1, borderBottom: "1px solid #eee", flexWrap: "wrap", gap: 1 }}
          >
            <Box>
              <Typography>{formatMonthYear(period.year, period.month)}</Typography>
              <StatusChip
                label={period.status === PeriodStatus.Closed ? "Cerrado" : period.status === PeriodStatus.Open ? "Abierto" : "Borrador"}
                tone={period.status === PeriodStatus.Closed ? "warning" : "success"}
              />
            </Box>
            {canManage && period.id === activePeriod?.id ? (
              <Box sx={{ display: "flex", gap: 1 }}>
                {period.status !== PeriodStatus.Closed ? (
                  <Button size="small" variant="outlined" onClick={() => void closePeriod()}>Cerrar</Button>
                ) : (
                  <Button size="small" variant="outlined" onClick={() => void reopenPeriod()}>Reabrir</Button>
                )}
              </Box>
            ) : null}
          </Box>
        ))}
      </Paper>
    </>
  );
}
