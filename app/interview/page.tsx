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
  Chip,
  Divider,
} from "@mui/material";
import {
  Send as SendIcon,
  Psychology as CoachIcon,
  Quiz as QuizIcon,
  MenuBook as BookIcon,
  Shuffle as ShuffleIcon,
  Search as SearchIcon,
  Code as CodeIcon,
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import AppLayout from "@/src/components/AppLayout";
import { useAuth } from "@/src/components/AuthProvider";
import { apiFetch } from "@/src/lib/api";

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
// 快捷操作
// --------------------------------------------------
const QUICK_ACTIONS = [
  {
    label: "随机抽题",
    icon: <ShuffleIcon fontSize="small" />,
    color: "#7c3aed",
    prompt: "请随机抽一道面试题给我",
    description: "随机出一道面试题",
  },
  {
    label: "隐藏答案自测",
    icon: <QuizIcon fontSize="small" />,
    color: "#dc2626",
    prompt: "请出一道面试题，先不要显示答案，让我来回答，等我回答后你再评判",
    description: "考一道题并隐藏答案",
  },
  {
    label: "前端知识点",
    icon: <SearchIcon fontSize="small" />,
    color: "#2563eb",
    prompt: "请帮我讲解一道前端面试知识点",
    description: "搜索并讲解前端知识点",
  },
  {
    label: "React 题",
    icon: <CodeIcon fontSize="small" />,
    color: "#0891b2",
    prompt: "请出几道 React 面试题",
    description: "React 相关面试题",
  },
  {
    label: "AI / RAG",
    icon: <BookIcon fontSize="small" />,
    color: "#059669",
    prompt: "请给我出几道大模型或RAG方向的面试题",
    description: "大模型 / RAG / LLM 面试题",
  },
  {
    label: "智能体架构",
    icon: <CoachIcon fontSize="small" />,
    color: "#d97706",
    prompt: "请出几道智能体架构和工具调用相关的面试题",
    description: "Agent 架构与工具调用",
  },
];

// --------------------------------------------------
// 面试教练页面
// --------------------------------------------------
export default function InterviewPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 未登录跳转
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [authLoading, user, router]);

  // 自动加载会话
  const fetchConversations = useCallback(async () => {
    try {
      const data = await apiFetch<Conversation[]>("/conversations");
      const list: Conversation[] = Array.isArray(data) ? data : [];
      list.sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      if (list.length > 0) {
        setActiveId(list[0].id);
        fetchMessages(list[0].id);
      }
    } catch {
      console.warn("加载会话列表失败");
    }
  }, []);

  const fetchMessages = useCallback(async (convId: string) => {
    try {
      setLoadingMessages(true);
      const data = await apiFetch<{ messages: Message[] }>(
        `/conversations/${encodeURIComponent(convId)}/messages`
      );
      setMessages(data?.messages || []);
    } catch {
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchConversations();
  }, [user, fetchConversations]);

  // 滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --------------------------------------------------
  // 创建新会话
  // --------------------------------------------------
  const createConversation = useCallback(async (): Promise<string | null> => {
    try {
      const thread = await apiFetch<Conversation>("/conversations", {
        method: "POST",
        body: JSON.stringify({ title: "面试教练" }),
      });
      setActiveId(thread.id);
      setMessages([]);
      return thread.id;
    } catch {
      return null;
    }
  }, []);

  // --------------------------------------------------
  // 发送消息（完整 SSE 流式输出）
  // --------------------------------------------------
  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isStreaming) return;

      let currentId = activeId;
      if (!currentId) {
        const newId = await createConversation();
        if (!newId) return;
        currentId = newId;
      }
      if (!currentId) return;
      const convId = currentId;

      const userMsg: Message = { role: "user", content: text };
      const newMessages = [...messages, userMsg];
      setMessages(newMessages);
      setInput("");
      setIsStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch("/mastra/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
            agentId: "interviewCoachAgent",
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

        setMessages((prev) => [...prev, { role: "assistant" as const, content: "" }]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith("data:")) continue;

            const jsonStr = trimmed.slice(5).trim();
            if (jsonStr === "[DONE]") continue;

            try {
              const chunk = JSON.parse(jsonStr);

              // Mastra v1 流格式：type:"text" / "text-delta" 均携带 payload.text
              if (
                (chunk.type === "text" || chunk.type === "text-delta") &&
                chunk.payload?.text
              ) {
                assistantContent += chunk.payload.text;
                setMessages((prev) => {
                  const copy = [...prev];
                  const last = copy[copy.length - 1];
                  if (last && last.role === "assistant") {
                    copy[copy.length - 1] = { ...last, content: assistantContent };
                  }
                  return copy;
                });
              } else if (chunk.type === "tool-call") {
                setMessages((prev) => {
                  const copy = [...prev];
                  const last = copy[copy.length - 1];
                  if (last && last.role === "assistant") {
                    copy[copy.length - 1] = {
                      ...last,
                      content:
                        assistantContent +
                        `\n\n[🔧 Calling ${chunk.payload?.toolName || chunk.toolName}...]`,
                    };
                  }
                  return copy;
                });
              } else if (chunk.type === "tool-result") {
                setMessages((prev) => {
                  const copy = [...prev];
                  const last = copy[copy.length - 1];
                  if (last && last.role === "assistant") {
                    const prevContent = assistantContent.replace(
                      /\n\n\[🔧 Calling .+?\]$/,
                      ""
                    );
                    copy[copy.length - 1] = {
                      ...last,
                      content:
                        prevContent +
                        `\n\n[✅ ${chunk.payload?.toolName || chunk.toolName} done]`,
                    };
                    assistantContent = prevContent;
                  }
                  return copy;
                });
              }
            } catch {
              // 忽略解析失败
            }
          }
        }

        // 持久化消息到服务端
        const baseUrl = `/conversations/${encodeURIComponent(convId)}/messages`;
        apiFetch(baseUrl, {
          method: "POST",
          body: JSON.stringify({ role: "user", content: text }),
        }).catch(() => {});
        if (assistantContent) {
          apiFetch(baseUrl, {
            method: "POST",
            body: JSON.stringify({ role: "assistant", content: assistantContent }),
          }).catch(() => {});
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return;
        const errorText = err instanceof Error ? err.message : "请求失败，请重试";
        setMessages((prev) => {
          const copy = [...prev];
          const last = copy[copy.length - 1];
          if (last && last.role === "assistant") {
            copy[copy.length - 1] = { ...last, content: errorText };
          } else {
            copy.push({ role: "assistant", content: errorText });
          }
          return copy;
        });
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [isStreaming, messages, activeId, createConversation]
  );

  const handleSend = () => {
    const text = input.trim();
    if (text) {
      sendMessage(text);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleStop = () => {
    abortRef.current?.abort();
  };

  const handleNewChat = async () => {
    await createConversation();
  };

  // --------------------------------------------------
  // 渲染
  // --------------------------------------------------
  return (
    <AppLayout>
      <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
        {/* 顶部 Agent 信息条 */}
        <Box
          sx={{
            px: 2,
            py: 1,
            borderBottom: "1px solid",
            borderColor: "divider",
            bgcolor: "background.default",
            display: "flex",
            alignItems: "center",
            gap: 1.5,
          }}
        >
          <Avatar
            sx={{
              width: 28,
              height: 28,
              bgcolor: "#7c3aed",
              fontSize: 16,
            }}
          >
            <CoachIcon sx={{ fontSize: 16 }} />
          </Avatar>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            面试教练 · Interview Coach
          </Typography>
          <Box sx={{ flex: 1 }} />
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            1548 道精选面试题 · 前端八股 + AI 应用 + 校招题库
          </Typography>
          <Chip
            label="新对话"
            size="small"
            variant="outlined"
            onClick={handleNewChat}
            sx={{
              fontSize: 11,
              height: 24,
              "&:hover": { bgcolor: "action.hover" },
            }}
          />
        </Box>

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
            /* 欢迎区域 + 快捷操作 */
            <Box
              sx={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                maxWidth: 600,
                width: "100%",
                gap: 3,
              }}
            >
              <Box sx={{ textAlign: "center" }}>
                <Avatar
                  sx={{
                    width: 72,
                    height: 72,
                    bgcolor: "#7c3aed",
                    mb: 2,
                    mx: "auto",
                  }}
                >
                  <CoachIcon sx={{ fontSize: 40 }} />
                </Avatar>
                <Typography variant="h5" sx={{ mb: 1, fontWeight: 600 }}>
                  面试教练
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  1548 道精选面试题，覆盖前端八股文（基础/进阶/高级/高频考点）、AI 应用方向（大模型/RAG/智能体/Prompt 工程/工具调用）和牛客网校招题库
                </Typography>
              </Box>

              <Divider sx={{ width: "100%" }}>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  快速开始
                </Typography>
              </Divider>

              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 1.5,
                  justifyContent: "center",
                }}
              >
                {QUICK_ACTIONS.map((action) => (
                  <Chip
                    key={action.label}
                    icon={action.icon}
                    label={action.label}
                    onClick={() => sendMessage(action.prompt)}
                    disabled={isStreaming}
                    sx={{
                      px: 1,
                      py: 1.5,
                      borderColor: action.color,
                      color: action.color,
                      fontWeight: 500,
                      "&:hover": {
                        bgcolor: `${action.color}14`,
                        borderColor: action.color,
                      },
                      "& .MuiChip-icon": {
                        color: action.color,
                      },
                    }}
                    variant="outlined"
                  />
                ))}
              </Box>

              <Typography variant="caption" sx={{ color: "text.disabled", mt: 2 }}>
                也可以在下方输入任意问题开始学习
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
                        bgcolor: "#7c3aed",
                        fontSize: 14,
                        flexShrink: 0,
                      }}
                    >
                      <CoachIcon sx={{ fontSize: 16 }} />
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
                        msg.role === "user" ? "primary.main" : "grey.100",
                      color: msg.role === "user" ? "#fff" : "text.primary",
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
              placeholder="输入面试问题... (Enter 发送，Shift+Enter 换行)"
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
                onClick={handleSend}
                disabled={!input.trim()}
                sx={{ flexShrink: 0 }}
              >
                <SendIcon />
              </IconButton>
            )}
          </Box>
        </Box>
      </Box>
    </AppLayout>
  );
}
