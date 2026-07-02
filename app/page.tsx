"use client";

import { useState } from "react";
import { ChatInput } from "@/components/ChatInput";
import { ChatWindow } from "@/components/ChatWindow";
import { useChat, type Message } from "@/hooks/useChat";

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const { sendMessage, isStreaming } = useChat({
    messages,
    onMessagesChange: setMessages,
  });

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-zinc-800 px-4 py-3">
        <h1 className="text-sm font-semibold text-zinc-200">
          Coding AI Assistant
        </h1>
      </header>
      <ChatWindow messages={messages} />
      <ChatInput onSend={sendMessage} disabled={isStreaming} />
    </div>
  );
}
