import { Agent } from "@mastra/core/agent";
import { openai } from "@ai-sdk/openai";

export const chatAgent = new Agent({
  id: "chatAgent",
  name: "chat-agent",
  instructions: `You are a helpful AI assistant. You provide concise, accurate, and friendly responses to user queries.
- Answer questions clearly and directly.
- If you don't know something, be honest about it.
- Use proper formatting when helpful.`,
  model: openai("gpt-4o-mini"),
});
