// src/services/aiService.ts
import { ChatMessage } from '../types';  // Adjust path if needed

const XAI_API_URL = 'https://api.x.ai/v1/chat/completions';

export interface GenerateCodeOptions {
  model?: string;  // e.g., 'grok-4', 'grok-code-fast-1'
  temperature?: number;  // 0.0-2.0, lower for deterministic code
  maxTokens?: number;   // Max output tokens
}

export async function generateCode(
  prompt: string,
  options: GenerateCodeOptions = {}
): Promise<string> {
  const apiKey = import.meta.env.VITE_XAI_API_KEY as string;

  if (!apiKey) {
    throw new Error('VITE_XAI_API_KEY is missing in .env.local. Add it and restart the dev server.');
  }

  const {
    model = 'grok-4',  // Default to flagship model
    temperature = 0.2, // Low for consistent code
    maxTokens = 1500,
  } = options;

  const response = await fetch(XAI_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: 'You are an expert React/TypeScript developer. Generate production-ready code only. Return valid, importable code with no explanations, markdown, or fences. Use Tailwind CSS for styling. Ensure TypeScript compatibility.',
        },
        {
          role: 'user',
          content: `Generate a React component based on this prompt: ${prompt}`,
        },
      ],
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`xAI API Error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  if (!data.choices || data.choices.length === 0) {
    throw new Error('No response from xAI API. Check your prompt or API key.');
  }

  return data.choices[0].message.content.trim();
}

// Optional: Helper to list available models (for UI dropdown)
export const AVAILABLE_MODELS = [
  { id: 'grok-4', name: 'Grok 4 (Flagship)', description: 'Best for complex code' },
  { id: 'grok-3', name: 'Grok 3', description: 'Enterprise programming' },
  { id: 'grok-3-mini', name: 'Grok 3 Mini', description: 'Lightweight reasoning' },
  { id: 'grok-code-fast-1', name: 'Grok Code Fast 1', description: 'Fast coding tasks' },
  { id: 'grok-4-fast-reasoning', name: 'Grok 4 Fast Reasoning', description: 'Efficient intelligence' },
  { id: 'grok-4-fast-non-reasoning', name: 'Grok 4 Fast Non-Reasoning', description: 'Quick non-reasoning' },
] as const;