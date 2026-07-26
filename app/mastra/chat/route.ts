import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MASTRA_API_URL = process.env.MASTRA_API_URL || "http://localhost:4111";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { agentId, messages, model, resourceId } = body;

    if (!agentId) {
      return NextResponse.json({ error: "缺少 agentId" }, { status: 400 });
    }
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "缺少消息内容" }, { status: 400 });
    }

    const mastraUrl = `${MASTRA_API_URL}/api/agents/${agentId}/stream`;

    const upstream = await fetch(mastraUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, model, resourceId }),
    });

    if (!upstream.ok || !upstream.body) {
      const text = await upstream.text();
      return NextResponse.json(
        { error: text || `Mastra 返回 ${upstream.status}` },
        { status: upstream.status }
      );
    }

    return new Response(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "聊天请求失败" },
      { status: 500 }
    );
  }
}
