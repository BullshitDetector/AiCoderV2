// src/services/aiService.ts
import { v4 as uuidv4 } from 'uuid';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIResponse {
  code: string;
  explanation: string;
  filename?: string;
}

export class AIService {
  private apiKey: string;
  private baseURL = 'https://api.x.ai/v1/chat/completions';
  private model = 'grok-code-fast-1'; // Fast coding model; swap to 'grok-4' for advanced reasoning

  constructor() {
    this.apiKey = import.meta.env.VITE_XAI_API_KEY;
    if (!this.apiKey) {
      throw new Error('VITE_XAI_API_KEY is required. Add to .env');
    }
  }

  async generateCode(prompt: string, context?: string): Promise<AIResponse> {
    const messages: Message[] = [
      {
        role: 'system',
        content: `You are an expert React/TypeScript developer. Generate production-ready, clean code based on the prompt. Use Tailwind for styling if relevant. Respond in JSON only: {"code": "full code block", "explanation": "brief steps taken", "filename": "suggested name like HelloWorld.tsx"}`,
      },
      {
        role: 'user',
        content: `
          Prompt: ${prompt}
          
          ${context ? `Context (existing code/files): ${context}` : ''}
        `,
      },
    ];

    try {
      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          max_tokens: 2000,
          temperature: 0.1, // Low for precise code
          stream: false, // Set to true for streaming if needed
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Grok API error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;

      // Parse JSON (Grok follows system prompts reliably)
      const parsed = JSON.parse(content) as AIResponse;
      return parsed;
    } catch (error) {
      console.error('AI Service Error:', error);
      // Offline fallback
      return {
        code: `// Fallback: Grok unavailable\nconsole.log("Prompt: ${prompt}");`,
        explanation: 'Grok integration failed—check API key and network. Using stub.',
        filename: 'fallback.tsx',
      };
    }
  }

  // For chat history/conversations
  async chat(message: string, history: Message[] = []): Promise<string> {
    const fullMessages = [...history, { role: 'user' as const, content: message }];
    const result = await this.generateCode(message, history.map(h => `${h.role}: ${h.content}`).join('\n'));
    return result.explanation;
  }
}

// Singleton
export const aiService = new AIService();