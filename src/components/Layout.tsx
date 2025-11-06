// src/components/Layout.tsx
import React from 'react';
import ChatInterface from './ChatInterface';
import FileTree from './FileTree';
import MonacoEditor from './MonacoEditor';
import Preview from './Preview';
import { useWebContainer } from '../hooks/useWebContainer';

export default function Layout({ children }: { children?: React.ReactNode }) {
  const { ready } = useWebContainer(); // Wait for boot

  if (!ready) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Booting AiCoderV2...</h1>
          <p className="text-gray-600">WebContainer starting (this takes ~30s first time).</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="h-12 border-b bg-white flex items-center px-4 font-medium shadow-sm">
        AiCoderV2 – AI-Powered IDE
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* File Tree (Left Sidebar) */}
        <aside className="w-64 border-r bg-gray-50 p-2">
          <FileTree />
        </aside>

        {/* Editor + Preview Split */}
        <div className="flex-1 flex">
          <section className="w-1/2 border-r bg-gray-900">
            <MonacoEditor />
          </section>
          <section className="w-1/2 relative">
            <Preview />
          </section>
        </div>
      </div>

      {/* Chat Footer (Bottom Panel with Input) */}
      <footer className="h-64 border-t bg-white shadow-lg">
        <ChatInterface />
      </footer>
    </div>
  );
}