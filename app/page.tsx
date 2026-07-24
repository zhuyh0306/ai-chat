"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Typography,
  Box,
  TextField,
  IconButton,
  Paper,
  CircularProgress,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import SmartToyOutlinedIcon from "@mui/icons-material/SmartToyOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import AppLayout from "@/src/components/AppLayout";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

let msgCounter = 0;
function nextId(): string {
  return `msg_${Date.now()}_${++msgCounter}`;
}

// ---------------------------------------------------------------------------
// Chat Bubble
// ---------------------------------------------------------------------------
function ChatBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        mb: 2,
        gap: 1.5,
      }}
    >
      {!isUser && (
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: 1.5,
            bgcolor: "secondary.main",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            mt: 0.5,
          }}
        >
          <SmartToyOutlinedIcon sx={{ fontSize: 16, color: "#fff" }} />
        </Box>
      )}
      <Paper
        elevation={0}
        sx={{
          maxWidth: "70%",
          px: 2,
          py: 1.5,
          borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
          bgcolor: isUser ? "primary.main" : "grey.100",
          color: isUser ? "#fff" : "text.primary",
        }}
      >
        <Typography
          variant="body2"
          sx={{ lineHeight: 1.6, whiteSpace: "pre-wrap" }}
        >
          {msg.content}
        </Typography>
      </Paper>
      {isUser && (
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: 1.5,
            bgcolor: "primary.main",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            mt: 0.5,
          }}
        >
          <PersonOutlinedIcon sx={{ fontSize: 16, color: "#fff" }} />
        </Box>
      )}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Loading Indicator
// ---------------------------------------------------------------------------
function LoadingBubble() {
  return (
    <Box sx={{ display: "flex", justifyContent: "flex-start", mb: 2, gap: 1.5 }}>
      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: 1.5,
          bgcolor: "secondary.main",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          mt: 0.5,
        }}
      >
        <SmartToyOutlinedIcon sx={{ fontSize: 16, color: "#fff" }} />
      </Box>
      <Paper
        elevation={0}
        sx={{
          px: 2,
          py: 2,
          borderRadius: "16px 16px 16px 4px",
          bgcolor: "grey.100",
          display: "flex",
          alignItems: "center",
          gap: 0.5,
        }}
      >
        <CircularProgress size={16} />
        <Typography variant="caption" color="text.secondary">
          Thinking...
        </Typography>
      </Paper>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Empty State
// ---------------------------------------------------------------------------
function EmptyState() {
  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        p: 4,
      }}
    >
      <Box
        sx={{
          width: 72,
          height: 72,
          borderRadius: 3,
          bgcolor: "primary.main",
          background: "linear-gradient(135deg, #2563eb, #7c3aed)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          mb: 3,
        }}
      >
        <SmartToyOutlinedIcon sx={{ fontSize: 36, color: "#fff" }} />
      </Box>
      <Typography variant="h6" sx={{ fontWeight: 600 }} gutterBottom>
        Start a conversation
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400 }}>
        Ask me anything — I&apos;m here to help with questions, brainstorming,
        coding, and more.
      </Typography>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------
export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const text = input.trim();
      if (!text || loading) return;

      const userMsg: Message = { id: nextId(), role: "user", content: text };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setLoading(true);

      const abortController = new AbortController();
      abortRef.current = abortController;

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [...messages, userMsg].map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }),
          signal: abortController.signal,
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const assistantId = nextId();
        setMessages((prev) => [
          ...prev,
          { id: assistantId, role: "assistant", content: "" },
        ]);

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data: ")) continue;
            const data = trimmed.slice(6);
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.type === "text" && parsed.content) {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, content: m.content + parsed.content }
                      : m,
                  ),
                );
              }
            } catch { /* ignore */ }
          }
        }
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        const msg = err instanceof Error ? err.message : String(err);
        setMessages((prev) => [
          ...prev,
          { id: nextId(), role: "assistant", content: `**Error**: ${msg}` },
        ]);
      } finally {
        setLoading(false);
        abortRef.current = null;
      }
    },
    [input, loading, messages],
  );

  return (
    <AppLayout title="AI Chat">
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}
      >
        {/* Message List */}
        <Box
          sx={{
            flex: 1,
            overflowY: "auto",
            px: { xs: 2, md: 4 },
            py: 3,
          }}
        >
          <Box sx={{ maxWidth: 800, mx: "auto" }}>
            {messages.length === 0 && !loading && <EmptyState />}

            {messages.map((msg) => (
              <ChatBubble key={msg.id} msg={msg} />
            ))}
            {loading && <LoadingBubble />}
            <div ref={messagesEndRef} />
          </Box>
        </Box>

        {/* Input Area */}
        <Box
          sx={{
            borderTop: 1,
            borderColor: "divider",
            px: { xs: 2, md: 4 },
            py: 2,
            bgcolor: "background.paper",
          }}
        >
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{
              maxWidth: 800,
              mx: "auto",
              display: "flex",
              alignItems: "flex-end",
              gap: 1.5,
            }}
          >
            <TextField
              fullWidth
              multiline
              maxRows={4}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="Type your message... (Enter to send)"
              disabled={loading}
              size="small"
              slotProps={{
                input: {
                  sx: {
                    borderRadius: 3,
                    fontSize: 14,
                    py: 1.5,
                    bgcolor: "grey.50",
                    "& fieldset": { borderColor: "transparent" },
                    "&:hover fieldset": { borderColor: "primary.light" },
                  },
                },
              }}
            />
            <IconButton
              type="submit"
              disabled={!input.trim() || loading}
              color="primary"
              sx={{
                width: 44,
                height: 44,
                borderRadius: 3,
                bgcolor: "primary.main",
                color: "#fff",
                "&:hover": { bgcolor: "primary.dark" },
                "&.Mui-disabled": {
                  bgcolor: "grey.200",
                  color: "grey.400",
                },
                flexShrink: 0,
              }}
            >
              <SendIcon fontSize="small" />
            </IconButton>
          </Box>
          <Typography
            variant="caption"
            color="text.disabled"
            sx={{ textAlign: "center", display: "block", mt: 1, maxWidth: 800, mx: "auto" }}
          >
            AI responses may be inaccurate. Verify important information.
          </Typography>
        </Box>
      </Box>
    </AppLayout>
  );
}
