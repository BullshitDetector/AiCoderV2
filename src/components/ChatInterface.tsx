// src/components/ChatInterface.tsx
import React, { useState, useRef, useEffect, useCallback } from "react";
import { Send, Loader2, X } from "lucide-react";
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
  const [currentCode, setCurrentCode] = useState(""); // live stream
  const [currentExplanation, setCurrentExplanation] = useState("");
  const abortController = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentCode, scrollToBottom]);

  const dispatchAddFile = (filename: string, code: string) => {
    window.dispatchEvent(
      new CustomEvent("addFile", { detail: { filename, code } })
    );
  };

  const addMessage = (msg: Message) => {
    setMessages((prev) => [...prev, msg]);
  };

  const cancelGeneration = () => {
    abortController.current?.abort();
    abortController.current = null;
    setIsLoading(false);
    setCurrentCode("");
    setCurrentExplanation("");
  };

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userPrompt = input.trim();
    setInput("");
    addMessage({ role: "user", content: userPrompt });
    setIsLoading(true);
    setCurrentCode("");
    setCurrentExplanation("");

    const controller = new AbortController();
    abortController.current = controller;

    try {
      const context = (window as any).getProjectContext?.() ?? "";

      const stream = aiService.generateCodeStream(
        userPrompt,
        context,
        controller.signal
      );

      let finalResponse: AIResponse | null = null;

      // Show streaming assistant message
      addMessage({
        role: "assistant",
        content: "", // will be filled incrementally
      });

      for await (const partial of stream) {
        if (!controller.signal.aborted) {
          setCurrentCode(partial.code ?? "");
          setCurrentExplanation(partial.explanation ?? "");
          finalResponse = partial as AIResponse;

          // Update last message live
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last.role === "assistant") {
              last.content =
                (partial.explanation ?? "") +
                (partial.code ? "\n\n```tsx\n" + (partial.code ?? "") + "\n```" : "");
            }
            return updated;
          });
        }
      }

      // Final insert
      if (finalResponse && !controller.signal.aborted) {
        const filename = finalResponse.filename ?? "Component.tsx";
        dispatchAddFile(filename, finalResponse.code);
        addMessage({
          role: "assistant",
          content: `${finalResponse.explanation}\n\n\`\`\`tsx\n${finalResponse.code}\n\`\`\``,
        });
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        addMessage({
          role: "assistant",
          content: `Error: ${err.message}`,
        });
      }
    } finally {
      setIsLoading(false);
      abortController.current = null;
      inputRef.current?.focus();
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-3 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          AI Assistant (xAI Grok)
        </h2>
        {isLoading && (
          <button
            onClick={cancelGeneration}
            className="text-gray-500 hover:text-red-600 transition"
            title="Cancel"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !isLoading && (
          <p className="text-center text-gray-500 dark:text-gray-400">
            Ask me to generate code…
          </p>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-xs md:max-w-md px-4 py-2 rounded-lg whitespace-pre-wrap ${
                m.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-center space-x-2 bg-gray-200 dark:bg-gray-700 px-4 py-2 rounded-lg">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Generating…</span>
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={submit}
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
                submit();
              }
            }}
            placeholder="Describe what you want…"
            className="flex-1 resize-none rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
            rows={1}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="inline-flex items-center justify-center rounded-md bg-blue-600 px-3 py-2 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
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