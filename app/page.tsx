"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

let msgCounter = 0;
function nextId(): string {
  return `msg_${Date.now()}_${++msgCounter}`;
}

function ChatBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <div
      className={`flex w-full ${isUser ? "justify-end" : "justify-start"} mb-4`}
    >
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-blue-600 text-white"
            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
        }`}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {msg.content}
        </p>
      </div>
    </div>
  );
}

function LoadingDots() {
  return (
    <div className="flex w-full justify-start mb-4">
      <div className="max-w-[80%] rounded-2xl px-5 py-4 bg-zinc-100 dark:bg-zinc-800">
        <div className="flex space-x-1.5">
          <div className="w-2 h-2 bg-zinc-400 dark:bg-zinc-500 rounded-full animate-bounce [animation-delay:0s]" />
          <div className="w-2 h-2 bg-zinc-400 dark:bg-zinc-500 rounded-full animate-bounce [animation-delay:0.15s]" />
          <div className="w-2 h-2 bg-zinc-400 dark:bg-zinc-500 rounded-full animate-bounce [animation-delay:0.3s]" />
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const text = input.trim();
      if (!text || loading) return;

      // 添加用户消息
      const userMsg: Message = { id: nextId(), role: "user", content: text };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setLoading(true);

      // 连接到 API 的 SSE 流
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

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        // 读取 SSE 流
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
                      : m
                  )
                );
              }
            } catch {
              // 忽略无法解析的行
            }
          }
        }
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        const msg = err instanceof Error ? err.message : String(err);
        setMessages((prev) => [
          ...prev,
          {
            id: nextId(),
            role: "assistant",
            content: `**Error**: ${msg}`,
          },
        ]);
      } finally {
        setLoading(false);
        abortRef.current = null;
      }
    },
    [input, loading, messages]
  );

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-zinc-950">
      {/* Header */}
      <header className="flex-shrink-0 border-b border-zinc-200 dark:border-zinc-800 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Mastra AI Chat
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Powered by Mastra.ai
            </p>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto">
          {messages.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center h-full text-center py-20">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
                  />
                </svg>
              </div>
              <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                Start a conversation
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm">
                Ask me anything — I&apos;m here to help with questions,
                brainstorming, coding, and more.
              </p>
            </div>
          )}

          {messages.map((msg) => (
            <ChatBubble key={msg.id} msg={msg} />
          ))}

          {loading && <LoadingDots />}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="flex-shrink-0 border-t border-zinc-200 dark:border-zinc-800 px-4 py-4">
        <form
          onSubmit={handleSubmit}
          className="max-w-3xl mx-auto flex items-end gap-3"
        >
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
              rows={1}
              disabled={loading}
              className="w-full resize-none rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-3 pr-12 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
            />
          </div>
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
              />
            </svg>
          </button>
        </form>
        <p className="text-center text-xs text-zinc-400 dark:text-zinc-500 mt-2 max-w-3xl mx-auto">
          AI responses may be inaccurate. Verify important information.
        </p>
      </div>
    </div>
  );
}
