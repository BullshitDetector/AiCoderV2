// src/components/Layout.tsx
import React from 'react';
import FileTree from './FileTree';
import MonacoEditor from './MonacoEditor';
import Preview from './Preview';
import ChatInterface from './ChatInterface';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen flex flex-col bg-gray-950 text-white">
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-80 flex flex-col border-r border-gray-800">
          <ChatInterface />
        </div>

        {/* Middle: File Tree + Editor */}
        <div className="flex-1 flex">
          <div className="w-64 border-r border-gray-800">
            <FileTree />
          </div>
          <div className="flex-1">
            <MonacoEditor />
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