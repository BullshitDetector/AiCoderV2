// src/components/ChatInterface.tsx
import React, { useState } from 'react';
import { aiService } from '../services/aiService';
import { getFileService } from '../services/fileService';
import { useWebContainer } from '../hooks/useWebContainer';
import { Send, Loader2 } from 'lucide-react';

export default function ChatInterface() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<
    { role: 'user' | 'assistant'; content: string; loading?: boolean }[]
  >([]);
  const [isSending, setIsSending] = useState(false);
  const { container: wc } = useWebContainer();
  const fileService = wc ? getFileService(wc) : null;

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !wc || !fileService || isSending) return;

    const prompt = input.trim();
    setMessages(m => [...m, { role: 'user', content: prompt }]);
    setInput('');
    setIsSending(true);
    setMessages(m => [...m, { role: 'assistant', content: 'Generating...', loading: true }]);

    try {
      const resp = await aiService.generateCode(prompt);
      if (!resp.filename) throw new Error('AI did not return filename');

      // THIS LINE WRITES THE FILE
      await fileService.applyAIResponse(resp);

      setMessages(m => [
        ...m.slice(0, -1),
        {
          role: 'assistant',
          content: `Created \`${resp.filename}\` and added to preview!\n\n${resp.explanation}`,
        },
      ]);
    } catch (err) {
      setMessages(m => [
        ...m.slice(0, -1),
        { role: 'assistant', content: `Error: ${(err as Error).message}` },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p className="mb-2">Ask me to build anything!</p>
            <p className="text-sm">e.g., "Create a countdown timer from 60 seconds"</p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md p-3 rounded-lg text-sm ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-800'
                }`}
              >
                {msg.loading && <Loader2 className="w-4 h-4 animate-spin inline mr-2" />}
                {msg.content}
              </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={send} className="p-4 border-t flex items-center gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type your prompt..."
          className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isSending}
          autoFocus
        />
        <button
          type="submit"
          disabled={!input.trim() || isSending || !fileService}
          className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
        >
          {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </form>
    </div>
  );
}