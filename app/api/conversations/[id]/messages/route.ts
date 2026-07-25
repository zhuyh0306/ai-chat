import { NextRequest, NextResponse } from "next/server";

const MASTRA_API = process.env.MASTRA_API_URL || "http://localhost:4111";

/**
 * GET /api/conversations/[id]/messages
 * 获取指定会话的历史消息
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const res = await fetch(`${MASTRA_API}/memory/threads/${id}/messages`);

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: text }, { status: res.status });
    }

    const data = await res.json();
    const messages = Array.isArray(data) ? data : data.messages || [];

    // 将 Mastra 格式转换为前端需要格式（过滤 system message）
    const formatted = messages
      .filter((m: { role: string }) => m.role !== "system")
      .map(
        (m: { role: string; content: string | Array<{ type: string; text: string; }> }) => ({
          role: m.role,
          content:
            typeof m.content === "string"
              ? m.content
              : Array.isArray(m.content)
                ? m.content
                    .filter((p: { type: string }) => p.type === "text")
                    .map((p: { text: string }) => p.text)
                    .join("")
                : "",
        }),
      );

    return NextResponse.json(formatted);
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to fetch messages" },
      { status: 500 },
    );
  }
}
