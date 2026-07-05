"use client";

import { useEffect, useState } from "react";
import { Alert, Button, MenuItem, Paper, Tab, Table, TableBody, TableCell, TableHead, TableRow, Tabs, TextField, Typography } from "@mui/material";
import * as XLSX from "xlsx";
import { useAppContext } from "@/frontend/context/AppContext";
import { reportsApi } from "@/frontend/api/reports.api";
import type { BudgetVsActualReport, CashFlowReport, CategoryReport, MonthlyComparisonReport } from "@/frontend/types/domain";
import { EmptyState, LoadingState, PageHeader } from "@/frontend/components/ui/States";
import { formatCurrency } from "@/frontend/utils/currency";
import { formatMonthYear } from "@/frontend/utils/dates";
import { getErrorMessage } from "@/frontend/utils/getErrorMessage";

export default function ReportsPage() {
  const { activeHousehold, activePeriod } = useAppContext();
  const [tab, setTab] = useState(0);
  const [months, setMonths] = useState(6);
  const [budgetReport, setBudgetReport] = useState<BudgetVsActualReport | null>(null);
  const [categoryReport, setCategoryReport] = useState<CategoryReport | null>(null);
  const [cashFlow, setCashFlow] = useState<CashFlowReport | null>(null);
  const [comparison, setComparison] = useState<MonthlyComparisonReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    if (!activeHousehold || !activePeriod) return;
    setLoading(true);
    setError("");
    try {
      const [budget, category, flow, monthly] = await Promise.all([
        reportsApi.budgetVsActual(activeHousehold.id, activePeriod.id),
        reportsApi.byCategory(activeHousehold.id, activePeriod.id),
        reportsApi.cashFlow(activeHousehold.id, activePeriod.id),
        reportsApi.monthlyComparison(activeHousehold.id, months),
      ]);
      setBudgetReport(budget);
      setCategoryReport(category);
      setCashFlow(flow);
      setComparison(monthly);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [activeHousehold?.id, activePeriod?.id, months]);

  const exportExcel = () => {
    if (!budgetReport || !activePeriod) return;
    const rows = budgetReport.lines.map((line) => ({
      Categoria: line.categoryName,
      Presupuestado: line.budgeted,
      Gastado: line.spent,
      Variacion: line.variance,
      Porcentaje: line.percentage,
    }));
    const sheet = XLSX.utils.json_to_sheet(rows);
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, "Presupuesto vs Real");
    XLSX.writeFile(book, `reporte-${activePeriod.year}-${activePeriod.month}.xlsx`);
  };

  if (!activeHousehold || !activePeriod) return <EmptyState title="Seleccione hogar y periodo" />;
  if (loading) return <LoadingState />;

  return (
    <>
      <PageHeader title="Reportes" subtitle={formatMonthYear(activePeriod.year, activePeriod.month)} action={<Button variant="outlined" onClick={exportExcel}>Exportar Excel</Button>} />
      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
      <Tabs value={tab} onChange={(_, value) => setTab(value)} sx={{ mb: 2 }}>
        <Tab label="Presupuesto vs real" />
        <Tab label="Por categoria" />
        <Tab label="Flujo de caja" />
        <Tab label="Comparacion mensual" />
      </Tabs>

      {tab === 0 && budgetReport ? (
        <Paper>
          <Typography sx={{ p: 2 }}>Variacion total: {formatCurrency(budgetReport.variance)}</Typography>
          <Table>
            <TableHead><TableRow><TableCell>Categoria</TableCell><TableCell align="right">Presupuesto</TableCell><TableCell align="right">Gastado</TableCell><TableCell align="right">Variacion</TableCell></TableRow></TableHead>
            <TableBody>{budgetReport.lines.map((line) => <TableRow key={line.categoryName}><TableCell>{line.categoryName}</TableCell><TableCell align="right">{formatCurrency(line.budgeted)}</TableCell><TableCell align="right">{formatCurrency(line.spent)}</TableCell><TableCell align="right">{formatCurrency(line.variance)}</TableCell></TableRow>)}</TableBody>
          </Table>
        </Paper>
      ) : null}
      {tab === 1 && categoryReport ? (
        <Paper>
          <Table>
            <TableHead><TableRow><TableCell>Categoria</TableCell><TableCell align="right">Gastado</TableCell><TableCell align="right">%</TableCell></TableRow></TableHead>
            <TableBody>{categoryReport.categories.map((c) => <TableRow key={c.categoryId}><TableCell>{c.categoryName}</TableCell><TableCell align="right">{formatCurrency(c.spent)}</TableCell><TableCell align="right">{c.percentage.toFixed(1)}%</TableCell></TableRow>)}</TableBody>
          </Table>
        </Paper>
      ) : null}
      {tab === 2 && cashFlow ? <Paper sx={{ p: 2 }}><Typography>Ingresos: {formatCurrency(cashFlow.totalIncome)} - Gastos: {formatCurrency(cashFlow.totalExpenses)} - Cierre: {formatCurrency(cashFlow.closingBalance)}</Typography></Paper> : null}
      {tab === 3 ? (
        <Paper sx={{ p: 2 }}>
          <TextField select label="Meses" value={months} onChange={(e) => setMonths(Number(e.target.value))} sx={{ mb: 2 }}>
            {[3, 6, 12].map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
          </TextField>
          {comparison ? (
            <Table>
              <TableHead><TableRow><TableCell>Periodo</TableCell><TableCell align="right">Presupuesto</TableCell><TableCell align="right">Gastado</TableCell></TableRow></TableHead>
              <TableBody>{comparison.months.map((m) => <TableRow key={`${m.year}-${m.month}`}><TableCell>{formatMonthYear(m.year, m.month)}</TableCell><TableCell align="right">{formatCurrency(m.budgeted)}</TableCell><TableCell align="right">{formatCurrency(m.spent)}</TableCell></TableRow>)}</TableBody>
            </Table>
          ) : null}
        </Paper>
      ) : null}
    </>
  );
}
