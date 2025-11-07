const xaiApiKey = import.meta.env.VITE_XAI_API_KEY;
const xaiBaseUrl = import.meta.env.VITE_XAI_API_BASE_URL || 'https://api.x.ai/v1';
const xaiModel = import.meta.env.VITE_XAI_MODEL || 'grok-beta';

if (!xaiApiKey) {
  console.warn('VITE_XAI_API_KEY is not set. xAI features will be disabled.');
}

export const generateCode = async (prompt: string): Promise<string> => {
  if (!xaiApiKey) throw new Error('xAI client not initialized. Check VITE_XAI_API_KEY.');

  try {
    const response = await fetch(`${xaiBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${xaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: xaiModel,
        messages: [
          { role: 'system', content: 'You are a senior full-stack React developer. Generate clean, production-ready TypeScript React code with Tailwind CSS. Include comments and best practices.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content?.trim() || '';
  } catch (error: any) {
    console.error('xAI API Error:', error);
    throw new Error(`Failed to generate code: ${error.message}`);
  }
};