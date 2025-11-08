// src/components/Layout.tsx
import React from 'react';
import FileTree from './FileTree';
import MonacoEditor from './MonacoEditor';
import Preview from './Preview';
import ChatInterface from './ChatInterface';
import Terminal from './Terminal';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen flex flex-col bg-gray-950 text-white">
      {/* Top: Chat | Editor Area | Preview */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Chat */}
        <div className="w-80 border-r border-gray-800">
          <ChatInterface />
        </div>

        {/* Center: Files + Editor + Terminal (vertical split) */}
        <div className="flex-1 flex flex-col">
          <div className="flex flex-1">
            {/* File Tree */}
            <div className="w-64 border-r border-gray-800">
              <FileTree />
            </div>
            {/* Editor */}
            <div className="flex-1">
              <MonacoEditor />
            </div>
          </div>
          {/* Terminal - full width under Files+Editor */}
          <div className="h-48 border-t border-gray-800">
            <Terminal />
          </div>
        </div>

        {/* Right: Preview */}
        <div className="w-96 border-l border-gray-800">
          <Preview />
        </div>
      </div>
    </div>
  );
}