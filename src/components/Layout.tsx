// src/components/Layout.tsx
import React, { useState, useEffect } from 'react';
import FileExplorer from './FileExplorer';
import MonacoEditor from './MonacoEditor';
import Preview from './Preview';
import ChatInterface from './ChatInterface';
import { writeFile, refreshFileTree } from '../services/fileService';
import { generateCodeFromPrompt } from '../services/aiService';
import { webContainerState } from '../hooks/useWebContainer';

export default function Layout() {
  const [selectedPath, setSelectedPath] = useState<string>('');
  const [editorContent, setEditorContent] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [containerReady, setContainerReady] = useState(false);

  // Track WebContainer readiness
  useEffect(() => {
    const unsubscribe = webContainerState.subscribe((state) => {
      setContainerReady(!!state.ready);
    });
    return unsubscribe;
  }, []);

  // Auto-save editor changes to WebContainer
  useEffect(() => {
    if (!selectedPath || !containerReady || isSaving) return;

    const timeout = setTimeout(async () => {
      setIsSaving(true);
      try {
        await writeFile(selectedPath, editorContent);
        // Trigger HMR via WebContainer (Vite will reload)
        const wc = (await import('../hooks/useWebContainer')).webContainer;
        const instance = await wc;
        instance?.fs.watch?.(selectedPath); // Optional: force watch
      } catch (err) {
        console.error('Save failed:', err);
      } finally {
        setIsSaving(false);
      }
    }, 600);

    return () => clearTimeout(timeout);
  }, [editorContent, selectedPath, containerReady, isSaving]);

  // Handle file selection from explorer
  const handleFileSelect = (path: string, content: string) => {
    setSelectedPath(path);
    setEditorContent(content);
  };

  // Handle AI code generation
  const handleAiSubmit = async (prompt: string) => {
    if (!containerReady) return;

    const result = await generateCodeFromPrompt(prompt);
    if (result.error) {
      // You can enhance ChatInterface to show errors
      console.error(result.error);
      return;
    }

    if (result.files) {
      for (const file of result.files) {
        await writeFile(file.path, file.content);
      }
      await refreshFileTree(); // Refresh explorer
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-950 text-gray-100 antialiased">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-2.5 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold tracking-tight">AiCoderV2</h1>
          <span className="text-xs text-gray-500 font-mono">v2.0</span>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="font-mono text-gray-400">
            {selectedPath || 'No file open'}
          </span>
          {isSaving && (
            <span className="flex items-center gap-1 text-yellow-400">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
              Saving...
            </span>
          )}
          {containerReady ? (
            <span className="flex items-center gap-1 text-green-400">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              Ready
            </span>
          ) : (
            <span className="flex items-center gap-1 text-orange-400">
              <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
              Booting...
            </span>
          )}
        </div>
      </header>

      {/* Main Layout: 4-Pane */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar: Chat + Explorer */}
        <div className="w-80 flex flex-col border-r border-gray-800">
          {/* Chat Panel */}
          <div className="flex-1 min-h-0 border-b border-gray-800">
            <ChatInterface onSubmit={handleAiSubmit} disabled={!containerReady} />
          </div>
          {/* File Explorer */}
          <div className="h-64 min-h-0">
            <FileExplorer
              onFileSelect={handleFileSelect}
              selectedPath={selectedPath}
            />
          </div>
        </div>

        {/* Center: Code Editor */}
        <div className="flex-1 flex flex-col min-w-0">
          <MonacoEditor
            path={selectedPath}
            value={editorContent}
            onChange={setEditorContent}
          />
        </div>

        {/* Right: Live Preview */}
        <div className="w-96 border-l border-gray-800">
          <Preview />
        </div>
      </div>
    </div>
  );
}