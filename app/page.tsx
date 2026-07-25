"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Box,
  TextField,
  IconButton,
  Typography,
  Paper,
  Avatar,
  CircularProgress,
  List,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Divider,
  Button,
} from "@mui/material";
import {
  Send as SendIcon,
  Chat as ChatIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import AppLayout from "@/src/components/AppLayout";

// --------------------------------------------------
// 类型定义
// --------------------------------------------------
interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

// --------------------------------------------------
// localStorage 键
// --------------------------------------------------
const CONV_KEY = "mastra-conversations";
const ACTIVE_KEY = "mastra-active-conversation";
const messagesKey = (id: string) => `mastra-messages-${id}`;

// --------------------------------------------------
// 工具函数
// --------------------------------------------------
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function formatDate(value: string | number | undefined) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString();
}

function loadConversations(): Conversation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CONV_KEY);
    const list = raw ? (JSON.parse(raw) as Conversation[]) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function saveConversations(list: Conversation[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CONV_KEY, JSON.stringify(list));
}

function loadMessages(convId: string): Message[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(messagesKey(convId));
    return raw ? (JSON.parse(raw) as Message[]) : [];
  } catch {
    return [];
  }
}

function saveMessages(convId: string, msgs: Message[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(messagesKey(convId), JSON.stringify(msgs));
}

// --------------------------------------------------
// 主页面组件
// --------------------------------------------------
export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loadingConvs, setLoadingConvs] = useState(true);

  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --------------------------------------------------
  // 初始化：从 localStorage 加载
  // --------------------------------------------------
  useEffect(() => {
    const convs = loadConversations();
    convs.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
    setConversations(convs);

    const saved = localStorage.getItem(ACTIVE_KEY);
    const target = saved && convs.find((c) => c.id === saved)
      ? saved
      : convs[0]?.id || null;

    setActiveId(target);
    if (target) {
      setLoadingMessages(true);
      setMessages(loadMessages(target));
      setLoadingMessages(false);
    }
    setLoadingConvs(false);
  }, []);

  // 滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --------------------------------------------------
  // 会话操作
  // --------------------------------------------------
  const createConversation = useCallback(() => {
    const now = new Date().toISOString();
    const conv: Conversation = {
      id: generateId(),
      title: "New Chat",
      createdAt: now,
      updatedAt: now,
    };
    const next = [conv, ...conversations];
    setConversations(next);
    saveConversations(next);
    setActiveId(conv.id);
    setMessages([]);
    saveMessages(conv.id, []);
    localStorage.setItem(ACTIVE_KEY, conv.id);
  }, [conversations]);

  const switchConversation = useCallback((conv: Conversation) => {
    if (conv.id === activeId) return;
    setActiveId(conv.id);
    localStorage.setItem(ACTIVE_KEY, conv.id);
    setLoadingMessages(true);
    setMessages(loadMessages(conv.id));
    setLoadingMessages(false);
  }, [activeId]);

  const deleteConversation = useCallback(
    (convId: string) => {
      const updated = conversations.filter((c) => c.id !== convId);
      setConversations(updated);
      saveConversations(updated);
      localStorage.removeItem(messagesKey(convId));

      if (activeId === convId) {
        localStorage.removeItem(ACTIVE_KEY);
        if (updated.length > 0) {
          setActiveId(updated[0].id);
          localStorage.setItem(ACTIVE_KEY, updated[0].id);
          setMessages(loadMessages(updated[0].id));
        } else {
          setActiveId(null);
          setMessages([]);
        }
      }
    },
    [activeId, conversations],
  );

  // --------------------------------------------------
  // 发送消息（支持流式 + localStorage 持久化）
  // --------------------------------------------------
  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isStreaming) return;

    let currentId = activeId;
    if (!currentId) {
      const now = new Date().toISOString();
      const conv: Conversation = {
        id: generateId(),
        title: text.slice(0, 30),
        createdAt: now,
        updatedAt: now,
      };
      currentId = conv.id;
      const next = [conv, ...conversations];
      setConversations(next);
      saveConversations(next);
      setActiveId(currentId);
      localStorage.setItem(ACTIVE_KEY, currentId);
    }

    const convId = currentId as string;
    const isFirstMessage = messages.length === 0;
    if (isFirstMessage) {
      saveMessages(convId, []);
    }
    const userMsg: Message = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
      setMessages(newMessages);
      saveMessages(convId, newMessages);
    setInput("");
    setIsStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";
      let assistantContent = "";

      // 先追加一条空的 assistant 消息用于流式填充
      setMessages((prev) => {
        const next = [...prev, { role: "assistant" as const, content: "" }];
        saveMessages(convId, next);
        return next;
      });

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // SSE 格式：每行 data: {...}
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data:")) continue;

          const jsonStr = trimmed.slice(5).trim();
          if (jsonStr === "[DONE]") continue;

          try {
            const chunk = JSON.parse(jsonStr);

            if (chunk.type === "text-delta" && chunk.payload?.text) {
              assistantContent += chunk.payload.text;
              setMessages((prev) => {
                const copy = [...prev];
                const last = copy[copy.length - 1];
                if (last && last.role === "assistant") {
                  copy[copy.length - 1] = {
                    ...last,
                    content: assistantContent,
                  };
                }
                saveMessages(convId, copy);
                return copy;
              });
            } else if (chunk.type === "tool-call") {
              setMessages((prev) => {
                const copy = [...prev];
                const last = copy[copy.length - 1];
                if (last && last.role === "assistant") {
                  copy[copy.length - 1] = {
                    ...last,
                    content: assistantContent + `\n\n[🔧 Calling ${chunk.payload?.toolName || chunk.toolName}...]`,
                  };
                }
                saveMessages(convId, copy);
                return copy;
              });
            } else if (chunk.type === "tool-result") {
              setMessages((prev) => {
                const copy = [...prev];
                const last = copy[copy.length - 1];
                if (last && last.role === "assistant") {
                  const prevContent = assistantContent.replace(
                    /\n\n\[🔧 Calling .+?\]$/,
                    "",
                  );
                  copy[copy.length - 1] = {
                    ...last,
                    content: prevContent + `\n\n[✅ ${chunk.payload?.toolName || chunk.toolName} done]`,
                  };
                  assistantContent = prevContent;
                }
                saveMessages(convId, copy);
                return copy;
              });
            }
          } catch {
            // 忽略解析失败的行
          }
        }
      }

      // 更新会话时间和标题
      setConversations((prev) => {
        const now = new Date().toISOString();
        const next = prev.map((c) =>
          c.id === convId
            ? {
                ...c,
                updatedAt: now,
                title: isFirstMessage
                  ? text.slice(0, 30) || c.title
                  : c.title,
              }
            : c,
        );
        saveConversations(next);
        return next;
      });
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      const errorText = err instanceof Error ? err.message : "发送失败，请重试";
      setMessages((prev) => {
        const copy = [...prev];
        const last = copy[copy.length - 1];
        if (last && last.role === "assistant") {
          copy[copy.length - 1] = { ...last, content: errorText };
        } else {
          copy.push({ role: "assistant", content: errorText });
        }
        saveMessages(convId, copy);
        return copy;
      });
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [input, isStreaming, messages, activeId, conversations]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleStop = () => {
    abortRef.current?.abort();
  };

  // --------------------------------------------------
  // 渲染
  // --------------------------------------------------
  return (
    <AppLayout>
      <Box
        sx={{
          display: "flex",
          height: "100%",
          overflow: "hidden",
        }}
      >
        {/* ========== 左侧：会话列表 ========== */}
        <Box
          sx={{
            width: 280,
            minWidth: 280,
            borderRight: "1px solid",
            borderColor: "divider",
            display: "flex",
            flexDirection: "column",
            bgcolor: "background.default",
          }}
        >
          {/* 新建会话按钮 */}
          <Box sx={{ p: 1.5 }}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<AddIcon />}
              onClick={createConversation}
              size="small"
              sx={{ textTransform: "none" }}
            >
              新对话
            </Button>
          </Box>

          <Divider />

          {/* 会话列表 */}
          <Box sx={{ flex: 1, overflow: "auto" }}>
            {loadingConvs ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <CircularProgress size={24} />
              </Box>
            ) : conversations.length === 0 ? (
              <Typography
                variant="body2"
                sx={{ p: 2, color: "text.secondary", textAlign: "center" }}
              >
                暂无对话，点击"新对话"开始
              </Typography>
            ) : (
              <List dense disablePadding>
                {conversations.map((conv) => (
                  <ListItemButton
                    key={conv.id}
                    selected={conv.id === activeId}
                    onClick={() => switchConversation(conv)}
                    sx={{
                      px: 1.5,
                      py: 1,
                      "&.Mui-selected": {
                        backgroundColor: "action.selected",
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <ChatIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary={conv.title || "New Chat"}
                      secondary={formatDate(conv.updatedAt)}
                      sx={{
                        "& .MuiListItemText-primary": {
                          fontSize: 13,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          fontWeight: conv.id === activeId ? 600 : 400,
                        },
                        "& .MuiListItemText-secondary": {
                          fontSize: 11,
                        },
                      }}
                    />
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConversation(conv.id);
                      }}
                      sx={{ opacity: 0.5, "&:hover": { opacity: 1 } }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </ListItemButton>
                ))}
              </List>
            )}
          </Box>
        </Box>

        {/* ========== 右侧：聊天区域 ========== */}
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {/* 消息列表 */}
          <Box
            sx={{
              flex: 1,
              overflow: "auto",
              px: { xs: 2, md: 4 },
              py: 3,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            {loadingMessages ? (
              <Box sx={{ mt: 8, textAlign: "center" }}>
                <CircularProgress />
                <Typography variant="body2" sx={{ mt: 1, color: "text.secondary" }}>
                  加载对话记录...
                </Typography>
              </Box>
            ) : messages.length === 0 ? (
              <Box
                sx={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "text.secondary",
                }}
              >
                <Typography variant="h5" sx={{ mb: 1, fontWeight: 300 }}>
                  有什么能帮助你的？
                </Typography>
                <Typography variant="body2">
                  选择一个对话或创建新对话开始聊天
                </Typography>
              </Box>
            ) : (
              <Box sx={{ width: "100%", maxWidth: 800 }}>
                {messages.map((msg, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      display: "flex",
                      gap: 2,
                      mb: 2.5,
                      justifyContent:
                        msg.role === "user" ? "flex-end" : "flex-start",
                    }}
                  >
                    {msg.role === "assistant" && (
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          bgcolor: "primary.main",
                          fontSize: 14,
                          flexShrink: 0,
                        }}
                      >
                        AI
                      </Avatar>
                    )}

                    <Paper
                      elevation={0}
                      sx={{
                        px: 2.5,
                        py: 1.5,
                        maxWidth: "75%",
                        borderRadius: 2.5,
                        bgcolor:
                          msg.role === "user"
                            ? "primary.main"
                            : "grey.100",
                        color:
                          msg.role === "user"
                            ? "#fff"
                            : "text.primary",
                        wordBreak: "break-word",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      <Typography variant="body2">
                        {msg.content}
                        {isStreaming &&
                          idx === messages.length - 1 &&
                          msg.role === "assistant" && (
                            <Box
                              component="span"
                              sx={{
                                display: "inline-block",
                                ml: 0.5,
                                animation: "blink 1s steps(1) infinite",
                                "@keyframes blink": {
                                  "50%": { opacity: 0 },
                                },
                              }}
                            >
                              ▌
                            </Box>
                          )}
                      </Typography>
                    </Paper>

                    {msg.role === "user" && (
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          bgcolor: "grey.600",
                          fontSize: 14,
                          flexShrink: 0,
                        }}
                      >
                        U
                      </Avatar>
                    )}
                  </Box>
                ))}
                <div ref={messagesEndRef} />
              </Box>
            )}
          </Box>

          {/* 底部输入栏 */}
          <Box
            sx={{
              borderTop: "1px solid",
              borderColor: "divider",
              px: { xs: 2, md: 4 },
              py: 2,
            }}
          >
            <Box
              sx={{
                maxWidth: 800,
                mx: "auto",
                display: "flex",
                gap: 1,
                alignItems: "flex-end",
              }}
            >
              <TextField
                fullWidth
                multiline
                maxRows={4}
                placeholder="输入消息... (Enter 发送，Shift+Enter 换行)"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isStreaming}
                variant="outlined"
                size="small"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 3,
                  },
                }}
              />
              {isStreaming ? (
                <IconButton
                  color="error"
                  onClick={handleStop}
                  sx={{ flexShrink: 0 }}
                >
                  <Box
                    sx={{
                      width: 20,
                      height: 20,
                      bgcolor: "error.main",
                      borderRadius: 0.5,
                    }}
                  />
                </IconButton>
              ) : (
                <IconButton
                  color="primary"
                  onClick={sendMessage}
                  disabled={!input.trim()}
                  sx={{ flexShrink: 0 }}
                >
                  <SendIcon />
                </IconButton>
              )}
            </Box>
          </Box>
        </Box>
      </Box>
    </AppLayout>
  );
}
