// src/components/ChatInterface.tsx
import React, { useState, useRef, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";
import { aiService } from "../services/aiService";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AIResponse {
  code: string;
  explanation: string;
  filename?: string;
}

export const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const inputRefRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(scrollToBottom, [messages]);

  // Helper: dispatch custom events for the rest of the app
  const dispatchAddFile = (filename: string, code: string) => {
    window.dispatchEvent(
      new CustomEvent("addFile", { detail: { filename, code } })
    );
  };
  const dispatchAddMessage = (msg: Message) => {
    setMessages((prev) => [...prev, msg]);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { role: "user", content: input.trim() };
    dispatchAddMessage(userMsg);
    setInput("");
    setIsLoading(true);

    try {
      // Optional: pass current project context (file tree) – implement getProjectContext() elsewhere
      const context = (window as any).getProjectContext?.() ?? "";

      const response: AIResponse = await aiService.generateCode(
        userMsg.content,
        context
      );

      // Add generated file
      const safeName = response.filename ?? "Generated.tsx";
      dispatchAddFile(safeName, response.code);

      // Show assistant explanation
      const assistantMsg: Message = {
        role: "assistant",
        content: response.explanation,
      };
      dispatchAddMessage(assistantMsg);
    } catch (err) {
      const errMsg: Message = {
        role: "assistant",
        content: `Error: ${(err as Error).message}`,
      };
      dispatchAddMessage(errMsg);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-3">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          AI Assistant (xAI Grok)
        </h2>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <p className="text-center text-gray-500 dark:text-gray-400">
            Ask me to generate a component, fix code, or explain anything.
          </p>
        )}
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-xs md:max-w-md px-4 py-2 rounded-lg ${
                msg.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-center space-x-2 bg-gray-200 dark:bg-gray-700 px-4 py-2 rounded-lg">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Thinking…</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-gray-200 dark:border-gray-700 p-3 bg-white dark:bg-gray-800"
      >
        <div className="flex space-x-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="Describe what you want to build…"
            className="flex-1 resize-none rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={1}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="inline-flex items-center justify-center rounded-md bg-blue-600 px-3 py-2 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
};