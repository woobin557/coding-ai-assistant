import type { Message } from "@/hooks/useChat";

export function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] whitespace-pre-wrap rounded-lg px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "bg-blue-600 text-white"
            : "border border-zinc-800 bg-zinc-900 text-zinc-100"
        }`}
      >
        {message.content || (isUser ? "" : "…")}
      </div>
    </div>
  );
}
