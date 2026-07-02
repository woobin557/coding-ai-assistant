import { GeminiProvider } from "./gemini";
import type { AIProvider } from "./types";

export type { AIProvider, ChatMessage, ChatRole } from "./types";

let cachedProvider: AIProvider | null = null;

/**
 * Single entry point the rest of the server uses to talk to an AI provider.
 * To switch providers (e.g. to Claude), implement AIProvider in a new file
 * and swap the instantiation below — nothing else in the app needs to change.
 */
export function getAIProvider(): AIProvider {
  if (cachedProvider) return cachedProvider;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not set. Add it to .env.local (see .env.example)."
    );
  }

  cachedProvider = new GeminiProvider(apiKey, process.env.GEMINI_MODEL);
  return cachedProvider;
}
