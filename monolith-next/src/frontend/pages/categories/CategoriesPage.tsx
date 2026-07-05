"use client";

import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
} from "@mui/material";
import { useAppContext } from "@/frontend/context/AppContext";
import { categoriesApi } from "@/frontend/api/budgets.api";
import type { ExpenseCategory } from "@/frontend/types/domain";
import { EmptyState, LoadingState, PageHeader } from "@/frontend/components/ui/States";
import { getErrorMessage } from "@/frontend/utils/getErrorMessage";
import { ExpenseCategoryType } from "@/frontend/types/domain";
import { expenseCategoryTypeLabel, expenseCategoryTypeOptions } from "@/frontend/utils/labels";

export default function CategoriesPage() {
  const { activeHousehold } = useAppContext();
  const [items, setItems] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    categoryType: ExpenseCategoryType.Variable as ExpenseCategoryType,
    icon: "category",
    color: "#607D8B",
  });

  const load = async () => {
    if (!activeHousehold) return;
    setLoading(true);
    try {
      setItems(await categoriesApi.list(activeHousehold.id));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [activeHousehold?.id]);

  const handleCreate = async () => {
    if (!activeHousehold) return;
    try {
      await categoriesApi.create(activeHousehold.id, form);
      setOpen(false);
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  if (!activeHousehold) return <EmptyState title="Seleccione un hogar" />;
  if (loading) return <LoadingState />;

  return (
    <>
      <PageHeader title="Categorias de gasto" action={<Button variant="contained" onClick={() => setOpen(true)}>Nueva categoria</Button>} />
      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
      <Paper>
        <Table>
          <TableHead><TableRow><TableCell>Nombre</TableCell><TableCell>Tipo</TableCell><TableCell>Color</TableCell><TableCell>Activa</TableCell><TableCell>Predeterminada</TableCell></TableRow></TableHead>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.name}</TableCell>
                <TableCell>{expenseCategoryTypeLabel(item.categoryType)}</TableCell>
                <TableCell><span style={{ color: item.color }}>{item.color}</span></TableCell>
                <TableCell>{item.isActive ? "Si" : "No"}</TableCell>
                <TableCell>{item.isDefault ? "Si" : "No"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Nueva categoria</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 2, pt: 1 }}>
          <TextField label="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <TextField label="Descripcion" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <TextField select label="Tipo" value={form.categoryType} onChange={(e) => setForm({ ...form, categoryType: Number(e.target.value) as ExpenseCategoryType })}>
            {expenseCategoryTypeOptions.map(([label, value]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}
          </TextField>
          <TextField label="Color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={() => void handleCreate()}>Guardar</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
