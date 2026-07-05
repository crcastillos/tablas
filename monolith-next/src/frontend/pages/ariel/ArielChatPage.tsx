"use client";

import { FormEvent, useMemo, useState } from "react";
import { Alert, Box, Button, Paper, Stack, TextField, Typography } from "@mui/material";

import { arielApi } from "@/frontend/api/ariel.api";
import { useAppContext } from "@/frontend/context/AppContext";
import { EmptyState, PageHeader } from "@/frontend/components/ui/States";
import { formatMonthYear } from "@/frontend/utils/dates";
import { getErrorMessage } from "@/frontend/utils/getErrorMessage";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

export default function ArielChatPage() {
  const { activeHousehold, activePeriod } = useAppContext();
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const periodLabel = useMemo(() => {
    if (!activePeriod) return "";
    return formatMonthYear(activePeriod.year, activePeriod.month);
  }, [activePeriod]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!activeHousehold || !activePeriod || loading) return;

    const message = prompt.trim();
    if (!message) return;

    setLoading(true);
    setError("");
    setPrompt("");
    setMessages((current) => [...current, { role: "user", text: message }]);

    try {
      const response = await arielApi.chat({
        message,
        householdId: activeHousehold.id,
        periodId: activePeriod.id,
      });
      setMessages((current) => [...current, { role: "assistant", text: response.reply }]);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (!activeHousehold || !activePeriod) {
    return <EmptyState title="Seleccione hogar y periodo" />;
  }

  return (
    <Stack spacing={2}>
      <PageHeader title="ARIEL" subtitle="Asistente financiero de solo lectura" />

      <Alert severity="info">
        Contexto activo: <strong>{activeHousehold.name}</strong> - {periodLabel}
      </Alert>
      <Alert severity="warning">
        ARIEL analiza solo información del hogar y período seleccionados. No realiza cambios en los datos.
      </Alert>
      {error ? <Alert severity="error">{error}</Alert> : null}

      <Paper sx={{ p: 2, minHeight: 320 }}>
        {messages.length === 0 ? (
          <Typography color="text.secondary">Haz una pregunta sobre ingresos, presupuesto, gastos o variaciones del período actual.</Typography>
        ) : (
          <Stack spacing={1.5}>
            {messages.map((message, index) => (
              <Box
                key={`${message.role}-${index}`}
                sx={{
                  alignSelf: message.role === "user" ? "flex-end" : "flex-start",
                  maxWidth: "85%",
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: message.role === "user" ? "primary.main" : "grey.100",
                  color: message.role === "user" ? "primary.contrastText" : "text.primary",
                }}
              >
                <Typography variant="body2" component="div" sx={{ 
                  whiteSpace: "pre-wrap",
                  "& p": { m: 0 },
                  "& ul, & ol": { pl: 2, m: 0 },
                  "& code": { bgcolor: "rgba(0,0,0,0.05)", px: 0.5, borderRadius: 0.5 }
                }}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {message.text}
                  </ReactMarkdown>
                </Typography>
              </Box>
            ))}
          </Stack>
        )}
      </Paper>

      <Paper component="form" onSubmit={submit} sx={{ p: 2 }}>
        <Stack spacing={1.5}>
          <TextField
            label="Tu consulta"
            placeholder="Ejemplo: ¿En qué categorías estoy excedido este mes?"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            multiline
            minRows={3}
            slotProps={{ htmlInput: { maxLength: 2000 } }}
          />
          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Button type="submit" variant="contained" disabled={loading || !prompt.trim()}>
              {loading ? "Consultando..." : "Enviar a ARIEL"}
            </Button>
          </Box>
        </Stack>
      </Paper>
    </Stack>
  );
}
