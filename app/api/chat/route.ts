import { NextRequest } from "next/server";

const MASTRA_API = (process.env.MASTRA_API_URL || "http://localhost:4111").replace(/\/$/, "");
const MASTRA_AGENT_ID = process.env.MASTRA_AGENT_ID || "assistant-agent";

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "messages array is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // 标准化消息格式，确保 content 是字符串
    const normalizedMessages = messages.map(
      (msg: { role: string; content: string | Array<{ type: string; text?: string }> }) => ({
        role: msg.role,
        content: Array.isArray(msg.content)
          ? msg.content
              .filter((p: { type: string }) => p.type === "text")
              .map((p: { text?: string }) => p.text || "")
              .join("\n")
          : String(msg.content || ""),
      }),
    );

    const response = await fetch(
      `${MASTRA_API}/api/agents/${MASTRA_AGENT_ID}/stream`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: normalizedMessages }),
      },
    );

    if (!response.ok) {
      const text = await response.text();
      return new Response(JSON.stringify({ error: text }), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 直接透传 Mastra 的 SSE 流
    return new Response(response.body, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
