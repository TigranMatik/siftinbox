import OpenAI from "openai";

// Lazy initialization to avoid build-time errors when API key isn't set
let openaiInstance: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (!openaiInstance) {
    openaiInstance = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiInstance;
}

// For backward compatibility
export const openai = {
  get chat() {
    return getOpenAI().chat;
  },
};
