import { isValidElement, type ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Message } from "@/hooks/useChat";
import { CodeBlock } from "./CodeBlock";

const markdownComponents: Components = {
  pre({ children }) {
    if (
      isValidElement<{ className?: string; children?: ReactNode }>(children)
    ) {
      const className = children.props.className ?? "";
      const match = /language-(\w+)/.exec(className);
      const code = String(children.props.children ?? "").replace(/\n$/, "");
      return <CodeBlock language={match?.[1] ?? "text"} code={code} />;
    }
    return <pre>{children}</pre>;
  },
  code({ className, children, ...props }) {
    return (
      <code
        className={`rounded bg-zinc-800 px-1.5 py-0.5 text-[13px] ${className ?? ""}`}
        {...props}
      >
        {children}
      </code>
    );
  },
  a({ children, ...props }) {
    return (
      <a
        className="text-blue-400 underline underline-offset-2 hover:text-blue-300"
        target="_blank"
        rel="noreferrer"
        {...props}
      >
        {children}
      </a>
    );
  },
};

export function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] whitespace-pre-wrap rounded-lg bg-blue-600 px-4 py-3 text-sm leading-relaxed text-white">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm leading-relaxed text-zinc-100">
        {message.content ? (
          <div className="prose prose-invert prose-sm max-w-none prose-code:before:content-none prose-code:after:content-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {message.content}
            </ReactMarkdown>
          </div>
        ) : (
          "…"
        )}
      </div>
    </div>
  );
}
