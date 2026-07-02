"use client";

import { Plus, Trash2 } from "lucide-react";
import type { Conversation } from "@/lib/storage";

interface SidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}

export function Sidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
}: SidebarProps) {
  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-zinc-800 bg-zinc-950">
      <div className="p-3">
        <button
          type="button"
          onClick={onNew}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 transition-colors hover:bg-zinc-800"
        >
          <Plus size={16} />
          새 대화
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto px-2 pb-3">
        {conversations.length === 0 ? (
          <p className="px-2 py-4 text-center text-xs text-zinc-600">
            대화 기록이 없습니다.
          </p>
        ) : (
          <ul className="flex flex-col gap-1">
            {conversations.map((conversation) => (
              <li key={conversation.id}>
                <div
                  className={`group flex items-center gap-1 rounded-lg px-2 py-2 text-sm ${
                    conversation.id === activeId
                      ? "bg-zinc-800 text-zinc-100"
                      : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onSelect(conversation.id)}
                    className="flex-1 truncate text-left"
                  >
                    {conversation.title}
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(conversation.id)}
                    aria-label="대화 삭제"
                    className="shrink-0 rounded p-1 text-zinc-500 opacity-0 transition-opacity hover:bg-zinc-700 hover:text-red-400 group-hover:opacity-100"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </nav>
    </aside>
  );
}
