// src/services/aiService.ts
interface Message {
  role: "user" | "system" | "assistant";
  content: string;
}

interface AIResponse {
  code: string;
  explanation: string;
  filename?: string;
}

const safeParseJSON = (text: string): AIResponse => {
  try {
    const obj = JSON.parse(text);
    if (!obj.code) throw new Error("Missing code");
    return obj;
  } catch {
    return {
      code: `// AI response was not valid JSON\n${text}`,
      explanation: "Failed to parse AI output.",
    };
  }
};

export class AIService {
  private apiKey = import.meta.env.VITE_XAI_API_KEY?.trim();
  private base = "https://api.x.ai/v1/chat/completions";
  private model = import.meta.env.VITE_XAI_MODEL ?? "grok-code-fast-1";

  constructor() {
    if (!this.apiKey) throw new Error("VITE_XAI_API_KEY is required");
  }

  /** Stream tokens → yield partial AIResponse objects */
  async *generateCodeStream(
    prompt: string,
    context = "",
    signal?: AbortSignal
  ): AsyncGenerator<Partial<AIResponse>, AIResponse> {
    const messages: Message[] = [
      {
        role: "system",
        content:
          "You are an expert React/TypeScript developer. Return ONLY valid JSON: " +
          '{"code":"...full file content...","explanation":"...one-sentence...","filename":"Component.tsx"}',
      },
      { role: "user", content: `Prompt: ${prompt}\nContext: ${context}` },
    ];

    const res = await fetch(this.base, {
      method: "POST",
      signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        max_tokens: 2000,
        temperature: 0.1,
        stream: true,
      }),
    });

    if (!res.ok) throw new Error(`xAI error: ${await res.text()}`);

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() ?? ""; // incomplete line

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6);
          if (json === "[DONE]") continue;

          try {
            const chunk = JSON.parse(json);
            const content = chunk.choices[0]?.delta?.content ?? "";
            if (content) {
              const partial = safeParseJSON(buffer.trim());
              yield partial;
            }
          } catch {
            // swallow malformed chunk
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    // Final parse
    return safeParseJSON(buffer.trim());
  }

  /** Legacy non-streaming call (for quick scripts) */
  async generateCode(prompt: string, context = ""): Promise<AIResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);

    try {
      const gen = this.generateCodeStream(prompt, context, controller.signal);
      let final: AIResponse = { code: "", explanation: "" };
      for await (const partial of gen) final = partial as AIResponse;
      return final;
    } finally {
      clearTimeout(timeout);
    }
  }
}

export const aiService = new AIService();