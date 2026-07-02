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
 *
 * Splits on line boundaries rather than blank-line event separators:
 * Google's server uses CRLF ("\r\n\r\n") between events rather than the
 * "\n\n" the SSE spec implies, and since each `data:` line always contains
 * a complete JSON object (embedded newlines are escaped as "\\n"), parsing
 * line-by-line as soon as a line is complete is both simpler and correct
 * regardless of which line ending is used.
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
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const text = extractTextFromLine(line);
        if (text) yield text;
      }
    }

    const text = extractTextFromLine(buffer);
    if (text) yield text;
  } finally {
    reader.releaseLock();
  }
}

function extractTextFromLine(line: string): string | null {
  const trimmed = line.trim();
  if (!trimmed.startsWith("data:")) return null;

  const jsonText = trimmed.slice("data:".length).trim();
  if (!jsonText) return null;

  try {
    const parsed = JSON.parse(jsonText);
    const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
    return typeof text === "string" ? text : null;
  } catch {
    return null;
  }
}
