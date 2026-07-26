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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import {
  Send as SendIcon,
  Chat as ChatIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
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

interface Agent {
  id: string;
  name: string;
  description: string;
  modelId: string;
  provider: string;
  supportsMemory: boolean;
}

interface ModelConfig {
  id: string;
  name: string;
  provider: string;
}

// --------------------------------------------------
// localStorage 键（仅保留用户偏好）
// --------------------------------------------------
const AGENT_KEY = "mastra-selected-agent";
const MODEL_KEY = "mastra-selected-model";

// --------------------------------------------------
// 工具函数
// --------------------------------------------------
function formatDate(value: string | number | undefined) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString();
}

// --------------------------------------------------
// 主页面组件
// --------------------------------------------------
export default function ChatPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loadingConvs, setLoadingConvs] = useState(true);

  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Agent 和 Model 选择
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [modelConfigs, setModelConfigs] = useState<ModelConfig[]>([]);

  // 未登录跳转到登录页
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [authLoading, user, router]);

  // --------------------------------------------------
  // 从服务端加载会话列表
  // --------------------------------------------------
  const fetchConversations = useCallback(async () => {
    try {
      setLoadingConvs(true);
      const data = await apiFetch<Conversation[]>("/conversations");
      const list: Conversation[] = Array.isArray(data) ? data : [];
      list.sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
      setConversations(list);
    } catch {
      console.warn("加载会话列表失败");
    } finally {
      setLoadingConvs(false);
    }
  }, []);

  // --------------------------------------------------
  // 从服务端加载消息
  // --------------------------------------------------
  const fetchMessages = useCallback(async (convId: string) => {
    try {
      setLoadingMessages(true);
      const data = await apiFetch<{ messages: Message[] }>(
        `/conversations/${encodeURIComponent(convId)}/messages`,
      );
      const msgs: Message[] = data?.messages || [];
      setMessages(msgs);
    } catch {
      console.warn("加载消息失败");
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  // --------------------------------------------------
  // 加载 agents 列表
  // --------------------------------------------------
  const fetchAgents = useCallback(async () => {
    try {
      // agents 由 Mastra 提供，经 Next.js 代理 /mastra/agents 获取（与 /agents 页面一致）
      const res = await fetch("/mastra/agents");
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = (await res.json()) as Agent[];
      setAgents(data);
      const savedAgent = localStorage.getItem(AGENT_KEY);
      if (savedAgent && data.find((a: Agent) => a.id === savedAgent)) {
        setSelectedAgent(savedAgent);
      } else if (data.length > 0) {
        setSelectedAgent(data[0].id);
      }
    } catch {
      console.warn("加载 Agent 列表失败");
    }
  }, []);

  // --------------------------------------------------
  // 加载模型配置（从服务端）
  // --------------------------------------------------
  const fetchModelConfigs = useCallback(async () => {
    try {
      const data = await apiFetch<ModelConfig[]>("/models");
      setModelConfigs(data);
    } catch {
      console.warn("加载模型配置失败");
    }
  }, []);

  // --------------------------------------------------
  // 初始化
  // --------------------------------------------------
  useEffect(() => {
    // 恢复选中的 model（仅偏好信息存 localStorage）
    const savedModel = localStorage.getItem(MODEL_KEY);
    if (savedModel) setSelectedModel(savedModel);

    // 从服务端加载数据
    Promise.all([
      fetchAgents(),
      fetchConversations(),
      fetchModelConfigs(),
    ]).then(() => {
      // 初始化完毕后，如果有会话则选中第一个
      setConversations((convs) => {
        if (convs.length > 0) {
          setActiveId(convs[0].id);
          fetchMessages(convs[0].id);
        }
        return convs;
      });
    });
  }, [fetchAgents, fetchConversations, fetchModelConfigs, fetchMessages]);

  // 滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --------------------------------------------------
  // 会话操作
  // --------------------------------------------------
  const createConversation = useCallback(async () => {
    try {
      const thread = await apiFetch<Conversation>("/conversations", {
        method: "POST",
        body: JSON.stringify({ title: "New Chat" }),
      });
      const conv: Conversation = {
        id: thread.id,
        title: thread.title || "New Chat",
        createdAt: thread.createdAt,
        updatedAt: thread.updatedAt,
      };
      setConversations((prev) => [conv, ...prev]);
      setActiveId(conv.id);
      setMessages([]);
    } catch {
      console.warn("创建会话失败");
    }
  }, []);

  const switchConversation = useCallback((conv: Conversation) => {
    if (conv.id === activeId) return;
    setActiveId(conv.id);
    fetchMessages(conv.id);
  }, [activeId, fetchMessages]);

  const deleteConversation = useCallback(
    async (convId: string) => {
      try {
        await apiFetch(`/conversations/${encodeURIComponent(convId)}`, {
          method: "DELETE",
        });
      } catch {
        console.warn("删除会话失败");
      }

      setConversations((prev) => {
        const updated = prev.filter((c) => c.id !== convId);
        if (activeId === convId) {
          if (updated.length > 0) {
            setActiveId(updated[0].id);
            fetchMessages(updated[0].id);
          } else {
            setActiveId(null);
            setMessages([]);
          }
        }
        return updated;
      });
    },
    [activeId, fetchMessages],
  );

  // --------------------------------------------------
  // Agent / Model 切换（偏好信息仍存 localStorage）
  // --------------------------------------------------
  const handleAgentChange = useCallback((agentId: string) => {
    setSelectedAgent(agentId);
    localStorage.setItem(AGENT_KEY, agentId);
  }, []);

  const handleModelChange = useCallback((modelId: string) => {
    setSelectedModel(modelId);
    localStorage.setItem(MODEL_KEY, modelId);
  }, []);

  // --------------------------------------------------
  // 发送消息
  // --------------------------------------------------
  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isStreaming) return;

    let currentId = activeId;
    if (!currentId) {
      // 自动创建会话
      try {
        const thread = await apiFetch<Conversation>("/conversations", {
          method: "POST",
          body: JSON.stringify({ title: text.slice(0, 30) }),
        });
        currentId = thread.id;
        const conv: Conversation = {
          id: thread.id,
          title: thread.title || text.slice(0, 30),
          createdAt: thread.createdAt,
          updatedAt: thread.updatedAt,
        };
        setConversations((prev) => [conv, ...prev]);
        setActiveId(currentId);
      } catch {
        console.warn("自动创建会话失败");
        return;
      }
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
      const body: Record<string, unknown> = {
        messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        agentId: selectedAgent || undefined,
      };
      if (selectedModel) {
        // Mastra 需要 "${provider}/${modelId}" 这种带 provider 的格式才能解析模型
        const cfg = modelConfigs.find((m) => m.id === selectedModel);
        body.model = cfg ? `${cfg.provider}/${cfg.id}` : selectedModel;
      }

      const res = await fetch("/mastra/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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

            if (chunk.type === "text-delta" && chunk.payload?.text) {
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
                    content: assistantContent + `\n\n[🔧 Calling ${chunk.payload?.toolName || chunk.toolName}...]`,
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
                    "",
                  );
                  copy[copy.length - 1] = {
                    ...last,
                    content: prevContent + `\n\n[✅ ${chunk.payload?.toolName || chunk.toolName} done]`,
                  };
                  assistantContent = prevContent;
                }
                return copy;
              });
            }
          } catch {
            // 忽略解析失败的行
          }
        }
      }

      // 保存消息到服务端（NestJS API，自动带 JWT）
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

      // 更新会话时间与标题
      setConversations((prev) =>
        prev.map((c) =>
          c.id === convId
            ? { ...c, title: text.slice(0, 30), updatedAt: new Date().toISOString() }
            : c,
        ),
      );
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
        return copy;
      });
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [input, isStreaming, messages, activeId, selectedAgent, selectedModel, modelConfigs]);

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
  // 当前选中 agent 信息
  // --------------------------------------------------
  const currentAgent = agents.find((a) => a.id === selectedAgent);

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

          {/* Agent 和 Model 选择器 */}
          <Box sx={{ p: 1.5, display: "flex", flexDirection: "column", gap: 1 }}>
            <FormControl size="small" fullWidth>
              <InputLabel sx={{ fontSize: 12 }}>Agent</InputLabel>
              <Select
                value={selectedAgent}
                label="Agent"
                onChange={(e) => handleAgentChange(e.target.value)}
                sx={{ fontSize: 13 }}
              >
                {agents.map((a) => (
                  <MenuItem key={a.id} value={a.id} sx={{ fontSize: 13 }}>
                    {a.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" fullWidth>
              <InputLabel sx={{ fontSize: 12 }}>Model</InputLabel>
              <Select
                value={selectedModel}
                label="Model"
                onChange={(e) => handleModelChange(e.target.value)}
                sx={{ fontSize: 13 }}
              >
                {modelConfigs.map((m) => (
                  <MenuItem key={m.id} value={m.id} sx={{ fontSize: 13 }}>
                    {m.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
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
          {/* 当前 agent 信息条 */}
          {currentAgent && (
            <Box
              sx={{
                px: 2,
                py: 1,
                borderBottom: "1px solid",
                borderColor: "divider",
                bgcolor: "background.default",
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                当前 Agent:
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                {currentAgent.name}
              </Typography>
              {selectedModel && (
                <>
                  <Typography variant="caption" sx={{ color: "text.secondary", ml: 1 }}>
                    Model:
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>
                    {modelConfigs.find((m) => m.id === selectedModel)?.name || selectedModel}
                  </Typography>
                </>
              )}
            </Box>
          )}

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
                  选择 Agent 和 Model，然后开始聊天
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
