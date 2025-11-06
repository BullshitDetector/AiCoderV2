// src/services/aiService.ts
interface Message { role: "user" | "system" | "assistant"; content: string; }
export interface AIResponse { code: string; explanation: string; filename?: string; }

const extractJSON = (text: string): string => {
  const fenced = text.match(/```(?:json)?\s*({[\s\S]*?})\s*```/);
  if (fenced) return fenced[1].trim();

  let depth = 0, start = -1;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '{') { if (depth === 0) start = i; depth++; }
    else if (text[i] === '}') { depth--; if (depth === 0 && start !== -1) return text.slice(start, i + 1); }
  }
  return text.trim();
};

const safeParseJSON = (raw: string): AIResponse => {
  try {
    const obj = JSON.parse(extractJSON(raw));
    if (typeof obj.code !== "string") throw new Error("Missing code");
    return {
      code: obj.code,
      explanation: obj.explanation ?? "No explanation.",
      filename: obj.filename,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Parse error";
    console.warn("[AI] Parse failed:", msg);
    return {
      code: `// AI JSON error\n// ${msg}\n${raw}`,
      explanation: "Invalid AI output.",
      filename: "Error.tsx",
    };
  }
};

export class AIService {
  private apiKey = import.meta.env.VITE_XAI_API_KEY?.trim();
  private model = import.meta.env.VITE_XAI_MODEL ?? "grok-code-fast-1";

  constructor() { if (!this.apiKey) throw new Error("VITE_XAI_API_KEY missing"); }

  private systemPrompt = `
You are a JSON-only React TSX generator.
Return ONLY:
{"code":"FULL TSX WITH \\n","explanation":"One sentence.","filename":"Name.tsx"}
NO markdown. NO extra text.`.trim();

  async generateCode(prompt: string, context = ""): Promise<AIResponse> {
    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: "system", content: this.systemPrompt },
          { role: "user", content: `Prompt: ${prompt}\nContext: ${context}` },
        ],
        max_tokens: 2000,
        temperature: 0,
        stream: false,
      }),
    });

    if (!res.ok) throw new Error(`xAI ${res.status}`);
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content ?? "";
    return safeParseJSON(content);
  }
}

export const aiService = new AIService();