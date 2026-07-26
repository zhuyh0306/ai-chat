import { NextRequest, NextResponse } from "next/server";
import { readData, writeData } from "@/src/lib/storage";

export interface StoredMessage {
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface StoredConversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: StoredMessage[];
}

/**
 * GET /api/conversations
 * 获取所有会话列表（不含消息内容）
 */
export async function GET() {
  const conversations = readData<StoredConversation[]>("conversations", []);
  const summaries = conversations
    .map(({ messages, ...rest }) => rest)
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  return NextResponse.json(summaries);
}

/**
 * POST /api/conversations
 * 创建新会话
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const title = body.title || "New Chat";
    const now = new Date().toISOString();
    const id = `conv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const newConv: StoredConversation = {
      id,
      title,
      createdAt: now,
      updatedAt: now,
      messages: [],
    };

    const conversations = readData<StoredConversation[]>("conversations", []);
    conversations.push(newConv);
    writeData("conversations", conversations);

    return NextResponse.json({
      id: newConv.id,
      title: newConv.title,
      createdAt: newConv.createdAt,
      updatedAt: newConv.updatedAt,
    });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create conversation" },
      { status: 500 },
    );
  }
}
