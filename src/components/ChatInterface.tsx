import React, { useState, CSSProperties } from 'react';
import { Send, Paperclip, Sparkles } from 'lucide-react';

interface ChatInterfaceProps {
  className?: string;
  style?: CSSProperties;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ className, style }) => {
  const [messages, setMessages] = useState([
    { id: 1, text: 'How can Bolt help you today?', sender: 'ai' },
    { id: 2, text: 'Create a Todo App with Supabase Integration', sender: 'user' },
    { id: 3, text: 'Generating...', sender: 'ai', steps: ['Create initial files', 'Install dependencies', 'npm install'] },
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (input.trim()) {
      setMessages([...messages, { id: messages.length + 1, text: input, sender: 'user' }]);
      setInput('');
      // Simulate AI response - integrate real aiService here
      setTimeout(() => {
        setMessages((prev) => [...prev, { id: prev.length + 1, text: 'Processing your request...', sender: 'ai', steps: ['Step 1', 'Step 2'] }]);
      }, 1000);
    }
  };

  return (
    <div className={`flex flex-col h-full ${className}`} style={style}>
      <div className="flex-1 overflow-y-auto space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`p-3 rounded-lg ${
              msg.sender === 'user' ? 'bg-blue-600 ml-auto max-w-[80%]' : 'bg-gray-700 mr-auto max-w-[80%]'
            }`}
          >
            <p className="text-sm">{msg.text}</p>
            {msg.steps && (
              <ul className="mt-2 space-y-1">
                {msg.steps.map((step, idx) => (
                  <li key={idx} className="flex items-center text-xs text-gray-300">
                    <Sparkles size={12} className="mr-1" /> {step}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center border-t border-gray-700 pt-4">
        <button className="text-gray-400 hover:text-white mr-2">
          <Paperclip size={20} />
        </button>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          className="flex-1 bg-gray-700 text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
          placeholder="Ask AI to generate code..."
        />
        <button onClick={handleSend} className="ml-2 bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600">
          <Send size={20} />
        </button>
      </div>
    </div>
  );
};

export default ChatInterface;