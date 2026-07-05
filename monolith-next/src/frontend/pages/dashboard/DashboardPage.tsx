"use client";

import { useEffect, useState } from "react";
import { Grid, Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import { useAppContext } from "@/frontend/context/AppContext";
import { reportsApi } from "@/frontend/api/reports.api";
import type { Dashboard } from "@/frontend/types/domain";
import {
  BudgetProgress,
  EmptyState,
  ErrorState,
  FinancialSummaryCard,
  LoadingState,
  PageHeader,
} from "@/frontend/components/ui/States";
import { formatCurrency } from "@/frontend/utils/currency";
import { formatMonthYear } from "@/frontend/utils/dates";
import { getErrorMessage } from "@/frontend/utils/getErrorMessage";

export default function DashboardPage() {
  const { activeHousehold, activePeriod } = useAppContext();
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    if (!activeHousehold || !activePeriod) return;
    setLoading(true);
    setError("");
    try {
      setData(await reportsApi.dashboard(activeHousehold.id, activePeriod.id));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [activeHousehold?.id, activePeriod?.id]);

  if (!activeHousehold) return <EmptyState title="Cree o seleccione un hogar" description="Vaya a Configuracion para crear su primer hogar." />;
  if (!activePeriod) return <EmptyState title="Abra un periodo mensual" description="Vaya a Periodo para crear el mes actual." />;
  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={() => void load()} />;
  if (!data) return null;

  return (
    <>
      <PageHeader title="Panel principal" subtitle={`${formatMonthYear(data.year, data.month)} - ${data.periodStatus}`} />
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}><FinancialSummaryCard label="Ingreso estimado" value={formatCurrency(data.estimatedIncome)} /></Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}><FinancialSummaryCard label="Ingreso recibido" value={formatCurrency(data.receivedIncome)} /></Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}><FinancialSummaryCard label="Presupuesto total" value={formatCurrency(data.totalBudgeted)} /></Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}><FinancialSummaryCard label="Gastos confirmados" value={formatCurrency(data.confirmedExpenses)} /></Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}><FinancialSummaryCard label="Gastos pendientes" value={formatCurrency(data.pendingExpenses)} /></Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}><FinancialSummaryCard label="Saldo estimado" value={formatCurrency(data.estimatedCashBalance)} /></Grid>
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: 2 }}>
            <BudgetProgress label="Utilizacion del presupuesto" percentage={data.budgetUtilizationPercentage} />
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Categorias con mayor gasto</Typography>
            <Table size="small">
              <TableHead><TableRow><TableCell>Categoria</TableCell><TableCell align="right">Gastado</TableCell></TableRow></TableHead>
              <TableBody>
                {data.topCategories.map((c) => (
                  <TableRow key={c.categoryId}><TableCell>{c.categoryName}</TableCell><TableCell align="right">{formatCurrency(c.spent)}</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Movimientos recientes</Typography>
            <Table size="small">
              <TableHead><TableRow><TableCell>Descripcion</TableCell><TableCell align="right">Monto</TableCell></TableRow></TableHead>
              <TableBody>
                {data.recentMovements.map((m) => (
                  <TableRow key={m.id}><TableCell>{m.description}</TableCell><TableCell align="right">{formatCurrency(m.amount)}</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </Grid>
      </Grid>
    </>
  );
}
