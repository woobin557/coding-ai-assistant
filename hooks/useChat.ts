"use client";

import { useCallback, useRef, useState } from "react";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface UseChatOptions {
  messages: Message[];
  onMessagesChange: (messages: Message[]) => void;
}

export function useChat({ messages, onMessagesChange }: UseChatOptions) {
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed || isStreaming) return;

      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: trimmed,
      };
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "",
      };

      const historyForRequest = [...messagesRef.current, userMessage];
      const withPending = [...historyForRequest, assistantMessage];
      messagesRef.current = withPending;
      onMessagesChange(withPending);
      setIsStreaming(true);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: historyForRequest.map(({ role, content }) => ({
              role,
              content,
            })),
          }),
        });

        if (!response.ok || !response.body) {
          const errorBody = await response.json().catch(() => null);
          throw new Error(errorBody?.error ?? "스트리밍 응답을 받지 못했습니다.");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          accumulated += decoder.decode(value, { stream: true });

          const updated = withPending.map((message) =>
            message.id === assistantMessage.id
              ? { ...message, content: accumulated }
              : message
          );
          messagesRef.current = updated;
          onMessagesChange(updated);
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "요청 중 오류가 발생했습니다.";
        const updated = messagesRef.current.map((message) =>
          message.id === assistantMessage.id
            ? { ...message, content: `[오류] ${errorMessage}` }
            : message
        );
        messagesRef.current = updated;
        onMessagesChange(updated);
      } finally {
        setIsStreaming(false);
      }
    },
    [isStreaming, onMessagesChange]
  );

  return { sendMessage, isStreaming };
}
