"use client";

import { FormEvent, useMemo, useState, useEffect, useRef } from "react";
import {
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
  IconButton,
  Fab,
  Dialog,
  AppBar,
  Toolbar,
  Slide,
  useMediaQuery,
  useTheme,
  CircularProgress,
  Alert,
  Fade,
  Tooltip,
} from "@mui/material";
import { TransitionProps } from "@mui/material/transitions";
import React from "react";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import CloseIcon from "@mui/icons-material/Close";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SendIcon from "@mui/icons-material/Send";
import MinimizeIcon from "@mui/icons-material/Minimize";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { arielApi } from "@/frontend/api/ariel.api";
import { useAppContext } from "@/frontend/context/AppContext";
import { formatMonthYear } from "@/frontend/utils/dates";
import { getErrorMessage } from "@/frontend/utils/getErrorMessage";

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any>;
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

export default function ArielChatWidget() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { activeHousehold, activePeriod } = useAppContext();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

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

  const toggleChat = () => {
    setIsOpen(!isOpen);
    setIsMinimized(false);
  };

  const handleMinimize = () => {
    setIsMinimized(true);
    setIsOpen(false);
  };

  const chatContent = (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", bgcolor: "background.paper" }}>
      {/* Header for Desktop Popover */}
      {!isMobile && (
        <Box sx={{ p: 2, bgcolor: "primary.main", color: "primary.contrastText", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <SmartToyIcon />
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>ARIEL</Typography>
          </Box>
          <Box>
            <IconButton size="small" color="inherit" onClick={handleMinimize}>
              <MinimizeIcon />
            </IconButton>
            <IconButton size="small" color="inherit" onClick={() => setIsOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      )}

      {/* Context Info */}
      <Box sx={{ px: 2, py: 1, bgcolor: "grey.50", borderBottom: 1, borderColor: "divider" }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
          Contexto: <strong>{activeHousehold?.name}</strong> - {periodLabel}
        </Typography>
      </Box>

      {/* Messages Area */}
      <Box sx={{ flexGrow: 1, overflowY: "auto", p: 2, display: "flex", flexDirection: "column", gap: 2 }}>
        {messages.length === 0 ? (
          <Box sx={{ textAlign: "center", mt: 4, color: "text.secondary", px: 2 }}>
            <SmartToyIcon sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
            <Typography variant="body2">
              Hola, soy ARIEL. ¿En qué puedo ayudarte con tus finanzas hoy?
            </Typography>
          </Box>
        ) : (
          messages.map((message, index) => (
            <Box
              key={`${message.role}-${index}`}
              sx={{
                alignSelf: message.role === "user" ? "flex-end" : "flex-start",
                maxWidth: "90%",
                p: 1.5,
                borderRadius: 2,
                bgcolor: message.role === "user" ? "primary.main" : "grey.100",
                color: message.role === "user" ? "primary.contrastText" : "text.primary",
                boxShadow: 1,
              }}
            >
              <Typography variant="body2" component="div" sx={{ 
                "& p": { m: 0 },
                "& ul, & ol": { pl: 2, m: 0 },
                "& code": { bgcolor: "rgba(0,0,0,0.05)", px: 0.5, borderRadius: 0.5 }
              }}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {message.text}
                </ReactMarkdown>
              </Typography>
            </Box>
          ))
        )}
        {loading && (
          <Box sx={{ alignSelf: "flex-start", bgcolor: "grey.100", p: 1.5, borderRadius: 2, display: "flex", alignItems: "center", gap: 1 }}>
            <CircularProgress size={16} />
            <Typography variant="caption">ARIEL está pensando...</Typography>
          </Box>
        ) }
        {error && (
          <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>
        )}
        <div ref={messagesEndRef} />
      </Box>

      {/* Input Area */}
      <Box component="form" onSubmit={submit} sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
        <Stack direction="row" spacing={1}>
          <TextField
            fullWidth
            size="small"
            placeholder="Escribe tu consulta..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={loading}
            autoComplete="off"
          />
          <IconButton color="primary" type="submit" disabled={loading || !prompt.trim()}>
            <SendIcon />
          </IconButton>
        </Stack>
      </Box>
    </Box>
  );

  if (!activeHousehold || !activePeriod) return null;

  return (
    <>
      {/* Floating Action Button */}
      <Tooltip title="Consultar a ARIEL" placement="left">
        <Fab
          color="primary"
          aria-label="ariel-chat"
          onClick={toggleChat}
          sx={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: theme.zIndex.speedDial,
            display: isOpen && !isMobile ? "none" : "flex",
          }}
        >
          <SmartToyIcon />
        </Fab>
      </Tooltip>

      {/* Mobile Full Screen Chat */}
      {isMobile ? (
        <Dialog
          fullScreen
          open={isOpen}
          onClose={() => setIsOpen(false)}
          slots={{ transition: Transition }}
        >
          <AppBar sx={{ position: "relative" }}>
            <Toolbar>
              <IconButton
                edge="start"
                color="inherit"
                onClick={() => setIsOpen(false)}
                aria-label="volver"
              >
                <ArrowBackIcon />
              </IconButton>
              <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
                ARIEL
              </Typography>
            </Toolbar>
          </AppBar>
          {chatContent}
        </Dialog>
      ) : (
        /* Desktop Popover Chat */
        <Fade in={isOpen}>
          <Paper
            elevation={6}
            sx={{
              position: "fixed",
              bottom: 24,
              right: 24,
              width: 400,
              height: 600,
              maxHeight: "calc(100vh - 48px)",
              zIndex: theme.zIndex.drawer + 2,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              borderRadius: 2,
            }}
          >
            {chatContent}
          </Paper>
        </Fade>
      )}
    </>
  );
}
