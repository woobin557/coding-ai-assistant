export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

/**
 * Common interface every AI provider must implement, so the rest of the app
 * (API route, hooks) never depends on a specific vendor SDK. Swapping models
 * (e.g. Gemini -> Claude) only requires a new file implementing this
 * interface and updating the export in lib/ai/index.ts.
 */
export interface AIProvider {
  streamChat(messages: ChatMessage[]): AsyncGenerator<string>;
}
