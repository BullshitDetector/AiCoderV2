// src/components/Terminal.tsx
import React, { useEffect, useRef } from 'react';
import { useWebContainerContext } from '../context/WebContainerContext';

export default function Terminal() {
  const { container, logs } = useWebContainerContext();
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!terminalRef.current || !logs.length) return;
    terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
  }, [logs]);

  return (
    <div className="h-full bg-black font-mono text-xs overflow-hidden flex flex-col">
      <div className="bg-gray-800 px-4 py-2 border-b border-gray-700">
        <span className="text-green-400">Terminal</span>
      </div>
      <pre
        ref={terminalRef}
        className="flex-1 p-4 overflow-y-auto text-green-400 whitespace-pre-wrap"
      >
        {logs.join('') || 'Terminal ready...'}
      </pre>
    </div>
  );
}