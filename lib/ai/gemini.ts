import type { AIProvider, ChatMessage } from "./types";

const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

const SYSTEM_INSTRUCTION = `You are a coding-focused AI assistant. Prioritize correct, working code.
Use Markdown, and put code in fenced code blocks with the correct language tag.
Be concise: explain only what's non-obvious, skip restating what the code already shows.`;

/**
 * Gemini implementation of AIProvider, using the REST streamGenerateContent
 * endpoint directly (alt=sse) instead of the SDK, to keep this module's only
 * dependency on Gemini's plain HTTP contract.
 */
export class GeminiProvider implements AIProvider {
  constructor(
    private readonly apiKey: string,
    private readonly model: string = "gemini-2.5-flash"
  ) {}

  async *streamChat(messages: ChatMessage[]): AsyncGenerator<string> {
    const url = `${API_BASE}/${this.model}:streamGenerateContent?alt=sse&key=${this.apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
        contents: messages.map((message) => ({
          role: message.role === "assistant" ? "model" : "user",
          parts: [{ text: message.content }],
        })),
      }),
    });

    if (!response.ok || !response.body) {
      const errorText = await response.text().catch(() => "");
      throw new Error(
        `Gemini API error (${response.status}): ${errorText || response.statusText}`
      );
    }

    yield* parseSseTextStream(response.body);
  }
}

/**
 * Reads a Gemini SSE body and yields only the generated text deltas,
 * hiding the `data: {...}` framing and JSON shape from callers.
 */
async function* parseSseTextStream(
  body: ReadableStream<Uint8Array>
): AsyncGenerator<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split("\n\n");
      buffer = events.pop() ?? "";

      for (const event of events) {
        const text = extractTextFromEvent(event);
        if (text) yield text;
      }
    }
  } finally {
    reader.releaseLock();
  }
}

function extractTextFromEvent(event: string): string | null {
  const dataLine = event
    .split("\n")
    .find((line) => line.startsWith("data:"));
  if (!dataLine) return null;

  const jsonText = dataLine.slice("data:".length).trim();
  if (!jsonText) return null;

  try {
    const parsed = JSON.parse(jsonText);
    const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
    return typeof text === "string" ? text : null;
  } catch {
    return null;
  }
}
