import { NextRequest, NextResponse } from "next/server";
import { readData, writeData } from "@/src/lib/storage";
import type { StoredConversation, StoredMessage } from "../../route";

/**
 * GET /api/conversations/[id]/messages
 * 获取指定会话的所有消息
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const convId = (await params).id;
  const conversations = readData<StoredConversation[]>("conversations", []);
  const conv = conversations.find((c) => c.id === convId);

  if (!conv) {
    return NextResponse.json(
      { error: "会话不存在" },
      { status: 404 },
    );
  }

  return NextResponse.json({ messages: conv.messages });
}

/**
 * POST /api/conversations/[id]/messages
 * 追加一条新消息（流式响应结束后由前端调用保存 assistant 消息）
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const convId = (await params).id;
    const body = await request.json();
    const { role, content } = body;

    if (!role || !content) {
      return NextResponse.json(
        { error: "role and content are required" },
        { status: 400 },
      );
    }

    const conversations = readData<StoredConversation[]>("conversations", []);
    const conv = conversations.find((c) => c.id === convId);

    if (!conv) {
      return NextResponse.json(
        { error: "会话不存在" },
        { status: 404 },
      );
    }

    const msg: StoredMessage = {
      role,
      content,
      createdAt: new Date().toISOString(),
    };
    conv.messages.push(msg);
    conv.updatedAt = new Date().toISOString();
    writeData("conversations", conversations);

    return NextResponse.json({ messages: conv.messages });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to save message" },
      { status: 500 },
    );
  }
}
