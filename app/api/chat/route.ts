const MASTRA_API_URL = process.env.MASTRA_API_URL || "http://8.133.180.60:4111";
const AGENT_ID = process.env.MASTRA_AGENT_ID || "assistant-agent";

export async function POST(req: Request) {
  const body = await req.json();

  // 将前端消息转为 Mastra 格式
  const messages = (body.messages || []).map((msg: Record<string, unknown>) => ({
    role: msg.role || "user",
    content:
      typeof msg.content === "string"
        ? msg.content
        : (msg.parts as Array<Record<string, unknown>>)
            ?.filter((p) => p.type === "text")
            .map((p) => p.text)
            .join("") || "",
  }));

  const apiUrl = `${MASTRA_API_URL}/api/agents/${AGENT_ID}/generate`;
  console.log(`[Mastra Proxy] → ${apiUrl}`);

  try {
    const mastraRes = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    });

    if (!mastraRes.ok) {
      const errorText = await mastraRes.text();
      const errorMsg = `Error ${mastraRes.status}: ${errorText}`;
      console.error(`[Mastra Proxy] ${errorMsg}`);

      return new Response(
        `data: ${JSON.stringify({ type: "text", content: errorMsg })}\n\ndata: [DONE]\n\n`,
        {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
          },
        }
      );
    }

    const result = await mastraRes.json();
    const responseText =
      result.text || result.response || result.content || JSON.stringify(result);

    console.log(`[Mastra Proxy] Response: ${responseText.slice(0, 200)}...`);

    // 流式逐字返回（模拟打字效果）
    const encoder = new TextEncoder();
    const chars = [...responseText]; // 按字符分割（支持中文）

    const stream = new ReadableStream({
      async start(controller) {
        // 逐字符推送（模拟流式效果）
        const chunkSize = 3; // 每次推送 3 个字符
        for (let i = 0; i < chars.length; i += chunkSize) {
          const chunk = chars.slice(i, i + chunkSize).join("");
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "text", content: chunk })}\n\n`
            )
          );
          await new Promise((r) => setTimeout(r, 15)); // 模拟延迟
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[Mastra Proxy] Exception: ${msg}`);
    return new Response(
      `data: ${JSON.stringify({ type: "text", content: `Request failed: ${msg}` })}\n\ndata: [DONE]\n\n`,
      {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      }
    );
  }
}
