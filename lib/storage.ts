import type { Message } from "@/hooks/useChat";

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
}

const STORAGE_KEY = "coding-ai-assistant:conversations";

export function loadConversations(): Conversation[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveConversations(conversations: Conversation[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
}

export function deriveTitle(messages: Message[]): string {
  const firstUserMessage = messages.find((message) => message.role === "user");
  if (!firstUserMessage) return "새 대화";

  const trimmed = firstUserMessage.content.trim().replace(/\s+/g, " ");
  if (!trimmed) return "새 대화";
  return trimmed.length > 40 ? `${trimmed.slice(0, 40)}…` : trimmed;
}
