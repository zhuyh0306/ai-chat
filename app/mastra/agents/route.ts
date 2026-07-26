import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MASTRA_API_URL = process.env.MASTRA_API_URL || "http://localhost:4111";

export async function GET() {
  try {
    const res = await fetch(`${MASTRA_API_URL}/api/agents`);
    if (!res.ok) {
      return NextResponse.json(
        { error: `Mastra 返回 ${res.status}` },
        { status: res.status }
      );
    }
    const data = await res.json();
    const agents = Object.entries(data).map(([key, value]) => {
      const agent = value as Record<string, unknown>;
      return {
        id: key,
        name: (agent.name as string) || key,
        description: (agent.description as string) || "",
        modelId: (agent.modelId as string) || "",
        provider: (agent.provider as string) || "",
        supportsMemory: (agent.supportsMemory as boolean) || false,
      };
    });
    return NextResponse.json(agents);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "获取 agents 失败" },
      { status: 500 }
    );
  }
}
