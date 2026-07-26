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
 * GET /api/models
 * 获取所有模型配置
 */
export async function GET() {
  const models = readData<ModelConfig[]>("models", DEFAULT_MODELS);
  return NextResponse.json(models);
}

/**
 * POST /api/models
 * 添加新模型
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, provider } = body;

    if (!id || !name || !provider) {
      return NextResponse.json(
        { error: "id, name, provider are required" },
        { status: 400 },
      );
    }

    const models = readData<ModelConfig[]>("models", DEFAULT_MODELS);

    if (models.find((m) => m.id === id)) {
      return NextResponse.json(
        { error: `模型 ID "${id}" 已存在` },
        { status: 409 },
      );
    }

    models.push({ id, name, provider });
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
 * PUT /api/models
 * 批量重置模型配置（用于重置默认）
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    // 如果传入 reset 标志，重置为默认
    if (body.reset) {
      writeData("models", DEFAULT_MODELS);
      return NextResponse.json(DEFAULT_MODELS);
    }

    // 否则批量保存
    const { models } = body;
    if (!Array.isArray(models)) {
      return NextResponse.json(
        { error: "models array is required" },
        { status: 400 },
      );
    }

    writeData("models", models);
    return NextResponse.json(models);
  } catch {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 },
    );
  }
}
