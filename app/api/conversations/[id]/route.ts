import { NextRequest, NextResponse } from "next/server";

const MASTRA_API = process.env.MASTRA_API_URL || "http://localhost:4111";

/**
 * DELETE /api/conversations/[id]
 * 删除指定会话
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const res = await fetch(`${MASTRA_API}/memory/threads/${id}`, {
      method: "DELETE",
    });

    if (!res.ok && res.status !== 404) {
      const text = await res.text();
      return NextResponse.json({ error: text }, { status: res.status });
    }

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to delete thread" },
      { status: 500 },
    );
  }
}
