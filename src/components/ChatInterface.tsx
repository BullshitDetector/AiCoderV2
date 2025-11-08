// src/components/ChatInterface.tsx
import React, { useState } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { useWebContainerContext } from '../context/WebContainerContext';

export default function ChatInterface() {
  const { container, ready } = useWebContainerContext();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    { role: 'assistant', content: 'Hey! Tell me what you want to build. I’ll create the files instantly.' }
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !container || !ready) return;

    const userMsg = input.trim();
    setMessages(m => [...m, { role: 'user', content: userMsg }]);
    setInput('');
    setMessages(m => [...m, { role: 'assistant', content: 'Thinking…' }]);

    // Placeholder – real AI will go here
    setTimeout(() => {
      setMessages(m => m.slice(0, -1)); // remove "Thinking…"
      setMessages(m => [...m, { role: 'assistant', content: `You said: "${userMsg}"\n\nAI file generation coming next!` }]);
    }, 800);
  };

  return (
    <div className="h-full flex flex-col bg-gray-900">
      <div className="px-4 py-3 border-b border-gray-700 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-purple-400" />
        <h3 className="font-semibold text-sm">AI Assistant</h3>
        {!ready && <span className="text-xs text-orange-400 ml-auto">Booting…</span>}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs px-4 py-2 rounded-lg ${
              msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-100'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={ready ? "Describe what you want…" : "Waiting for WebContainer…"}
            className="flex-1 bg-gray-800 text-gray-100 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            disabled={!ready}
          />
          <button
            type="submit"
            disabled={!ready || !input.trim()}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-lg transition"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}