import { Agent } from "@mastra/core/agent";
import { createOpenAI } from "@ai-sdk/openai";

// 使用阿里云 DashScope（通义千问）OpenAI 兼容接口
// 必须用 .chat() 走 Chat Completions API，否则工具调用会 400 报错
const dashscope = createOpenAI({
  apiKey: process.env.DASHSCOPE_API_KEY || "",
  baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
});

export const chatAgent = new Agent({
  id: "chatAgent",
  name: "chat-agent",
  instructions: `You are a helpful AI assistant. You provide concise, accurate, and friendly responses to user queries.
- Answer questions clearly and directly.
- If you don't know something, be honest about it.
- Use proper formatting when helpful.`,
  model: dashscope.chat(process.env.DASHSCOPE_MODEL || "qwen-plus"),
});
