import React, { CSSProperties, useState, useRef, useEffect } from 'react';
import { Send, Sparkles, FilePlus } from 'lucide-react';
import { useWebContainerContext } from '../context/WebContainerContext';
import { generateCode } from '../services/xaiService';

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
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { wc, setCurrentFile } = useWebContainerContext();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (input.trim()) {
      const userMessage = { id: messages.length + 1, text: input, sender: 'user' };
      setMessages([...messages, userMessage]);
      setInput('');
      setIsLoading(true);

      try {
        const code = await generateCode(input);
        const fileName = `src/components/${input.split(' ')[0] || 'GeneratedComponent'}.tsx`.toLowerCase();
        if (wc) {
          await wc.fs.writeFile(fileName, code);
          setCurrentFile(fileName);
          const aiMessage = { id: messages.length + 2, text: `Generated and saved to ${fileName}:\n\`\`\`tsx\n${code}\n\`\`\``, sender: 'ai' };
          setMessages(prev => [...prev, aiMessage]);
        } else {
          const aiMessage = { id: messages.length + 2, text: `Generated code (save manually):\n\`\`\`tsx\n${code}\n\`\`\``, sender: 'ai' };
          setMessages(prev => [...prev, aiMessage]);
        }
      } catch (error: any) {
        const errorMessage = { id: messages.length + 2, text: `Error: ${error.message}`, sender: 'ai' };
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
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
        <button className="text-gray-400 hover:text-white mr-2" title="Attach file">
          <FilePlus size={20} />
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