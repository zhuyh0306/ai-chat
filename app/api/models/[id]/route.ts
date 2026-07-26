import { NextRequest, NextResponse } from "next/server";
import { readData, writeData } from "@/src/lib/storage";

interface ModelConfig {
  id: string;
  name: string;
  provider: string;
}

const DEFAULT_MODELS: ModelConfig[] = [
  { id: "deepseek-v4-flash", name: "DeepSeek V4 Flash", provider: "alibaba-cn" },
  { id: "deepseek-v3", name: "DeepSeek V3", provider: "alibaba-cn" },
  { id: "qwen3-235b-a22b", name: "Qwen3 235B", provider: "alibaba-cn" },
  { id: "qwen-plus", name: "Qwen Plus", provider: "alibaba-cn" },
];

/**
 * PUT /api/models/[id]
 * 更新指定模型
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const modelId = (await params).id;
    const body = await request.json();
    const { name, provider } = body;

    if (!name || !provider) {
      return NextResponse.json(
        { error: "name and provider are required" },
        { status: 400 },
      );
    }

    const models = readData<ModelConfig[]>("models", DEFAULT_MODELS);
    const index = models.findIndex((m) => m.id === modelId);

    if (index === -1) {
      return NextResponse.json(
        { error: `模型 "${modelId}" 不存在` },
        { status: 404 },
      );
    }

    models[index] = { id: modelId, name, provider };
    writeData("models", models);

    return NextResponse.json(models);
  } catch {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 },
    );
  }
}

/**
 * DELETE /api/models/[id]
 * 删除指定模型
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const modelId = (await params).id;
    const models = readData<ModelConfig[]>("models", DEFAULT_MODELS);
    const filtered = models.filter((m) => m.id !== modelId);

    if (filtered.length === models.length) {
      return NextResponse.json(
        { error: `模型 "${modelId}" 不存在` },
        { status: 404 },
      );
    }

    writeData("models", filtered);
    return NextResponse.json(filtered);
  } catch {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 },
    );
  }
}
