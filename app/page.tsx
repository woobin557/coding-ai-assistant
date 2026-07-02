"use client";

import { useEffect, useRef, useState } from "react";
import { ChatInput } from "@/components/ChatInput";
import { ChatWindow } from "@/components/ChatWindow";
import { Sidebar } from "@/components/Sidebar";
import { useChat, type Message } from "@/hooks/useChat";
import {
  deriveTitle,
  loadConversations,
  saveConversations,
  type Conversation,
} from "@/lib/storage";

export default function Home() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Mirrors activeId but updates synchronously (not via React's render/effect
  // cycle) so that mid-stream calls to handleMessagesChange - which fire many
  // times per second while a response streams in - always see the id they
  // just created instead of a stale closure, which would otherwise mint a
  // new conversation on every chunk.
  const activeIdRef = useRef<string | null>(null);

  // localStorage isn't available during SSR, so conversations are hydrated
  // here rather than via lazy useState initial value (which would mismatch
  // between server and client render output).
  useEffect(() => {
    const stored = loadConversations();
    const initialId = stored[0]?.id ?? null;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setConversations(stored);
    activeIdRef.current = initialId;
    setActiveId(initialId);
  }, []);

  const activeConversation =
    conversations.find((conversation) => conversation.id === activeId) ?? null;
  const messages = activeConversation?.messages ?? [];

  const handleMessagesChange = (updatedMessages: Message[]) => {
    const isNewConversation = activeIdRef.current === null;
    const targetId = activeIdRef.current ?? crypto.randomUUID();
    activeIdRef.current = targetId;

    setConversations((prev) => {
      const exists = prev.some((conversation) => conversation.id === targetId);
      const next = exists
        ? prev.map((conversation) =>
            conversation.id === targetId
              ? {
                  ...conversation,
                  messages: updatedMessages,
                  title:
                    conversation.messages.length === 0
                      ? deriveTitle(updatedMessages)
                      : conversation.title,
                  updatedAt: Date.now(),
                }
              : conversation
          )
        : [
            {
              id: targetId,
              title: deriveTitle(updatedMessages),
              messages: updatedMessages,
              updatedAt: Date.now(),
            },
            ...prev,
          ];

      saveConversations(next);
      return next;
    });

    if (isNewConversation) {
      setActiveId(targetId);
    }
  };

  const { sendMessage, isStreaming } = useChat({
    messages,
    onMessagesChange: handleMessagesChange,
  });

  const handleSelect = (id: string) => {
    activeIdRef.current = id;
    setActiveId(id);
  };

  const handleNew = () => {
    activeIdRef.current = null;
    setActiveId(null);
  };

  const handleDelete = (id: string) => {
    setConversations((prev) => {
      const next = prev.filter((conversation) => conversation.id !== id);
      saveConversations(next);
      return next;
    });
    if (activeId === id) {
      activeIdRef.current = null;
      setActiveId(null);
    }
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        onSelect={handleSelect}
        onNew={handleNew}
        onDelete={handleDelete}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="border-b border-zinc-800 px-4 py-3">
          <h1 className="text-sm font-semibold text-zinc-200">
            Coding AI Assistant
          </h1>
        </header>
        <ChatWindow messages={messages} />
        <ChatInput onSend={sendMessage} disabled={isStreaming} />
      </div>
    </div>
  );
}
