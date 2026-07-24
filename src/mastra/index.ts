import { Mastra } from "@mastra/core";
import { chatAgent } from "./agents/chat-agent";

export const mastra = new Mastra({
  agents: { chatAgent },
});
