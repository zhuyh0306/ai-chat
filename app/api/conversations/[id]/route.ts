import { NextRequest, NextResponse } from "next/server";
import { readData, writeData } from "@/src/lib/storage";
import type { StoredConversation } from "../route";

/**
 * DELETE /api/conversations/[id]
 * 删除指定会话
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const convId = (await params).id;
  const conversations = readData<StoredConversation[]>("conversations", []);
  const filtered = conversations.filter((c) => c.id !== convId);

  if (filtered.length === conversations.length) {
    return NextResponse.json(
      { error: "会话不存在" },
      { status: 404 },
    );
  }

  writeData("conversations", filtered);
  return NextResponse.json({ success: true });
}
