import { NextRequest, NextResponse } from "next/server";

const MASTRA_API = process.env.MASTRA_API_URL || "http://localhost:4111";
const RESOURCE_ID = "default-user";

/**
 * GET /api/conversations
 * 获取所有会话（thread）列表
 */
export async function GET() {
  try {
    const res = await fetch(
      `${MASTRA_API}/memory/threads?resourceId=${RESOURCE_ID}`,
    );
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: text }, { status: res.status });
    }
    const data = await res.json();
    // 按更新时间倒序
    const threads = Array.isArray(data) ? data : data.threads || [];
    return NextResponse.json(threads);
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to fetch threads" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/conversations
 * 创建新会话（thread）
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const title = body.title || "New Chat";

    const res = await fetch(`${MASTRA_API}/memory/threads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        resourceId: RESOURCE_ID,
        metadata: {},
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: text }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create thread" },
      { status: 500 },
    );
  }
}
