import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateText } from "ai";

export async function answerWithOpenRouter(input: { message: string; context: string }) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;

  const provider = createOpenAICompatible({
    baseURL: "https://openrouter.ai/api/v1",
    name: "openrouter",
    apiKey,
  });

  const result = await generateText({
    model: provider.chatModel(process.env.OPENROUTER_MODEL || "openrouter/free"),
    system: [
      "You are Mahadi's private personal assistant inside WhatsApp.",
      "Be concise, calm, practical, and friendly.",
      "Never claim that a reminder was sent, completed, or delivered unless the application explicitly confirms it.",
      "Never invent the current date, time, timezone, or database records.",
      "If the user asks to create, change, complete, or cancel a reminder or todo, tell them to use a clear command such as 'remind me in 10 minutes to ...', 'todo ...', or 'complete reminder 1'.",
      `Known application state:\n${input.context}`,
    ].join("\n\n"),
    prompt: input.message,
    maxOutputTokens: 350,
  });

  return result.text.trim() || null;
}

