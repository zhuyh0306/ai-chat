import { Mastra } from "@mastra/core";
import { chatAgent } from "./agents/chat-agent";
import { interviewCoachAgent } from "./agents/interview-coach-agent";

export const mastra = new Mastra({
  agents: {
    chatAgent,
    interviewCoachAgent,
  },
});
