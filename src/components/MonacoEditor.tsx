// src/components/MonacoEditor.tsx
import React, { useEffect, useRef, useState } from 'react';
import loader from '@monaco-editor/loader';
import { useWebContainerContext } from '../context/WebContainerContext';

export default function MonacoEditor() {
  const editorRef = useRef<HTMLDivElement>(null);
  const monacoRef = useRef<any>(null);
  const editorInstanceRef = useRef<any>(null);
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const { container } = useWebContainerContext();

  // Initialize Monaco only once
  useEffect(() => {
    if (!editorRef.current) return;

    let disposed = false;

    loader.init().then((monaco) => {
      if (disposed) return;

      monacoRef.current = monaco;

      editorInstanceRef.current = monaco.editor.create(editorRef.current!, {
        value: '// Select a file to start editing\n',
        language: 'typescript',
        theme: 'vs-dark',
        automaticLayout: true,
        minimap: { enabled: false },
        fontSize: 14,
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        rulers: [80],
        tabSize: 2,
        insertSpaces: true,
      });

      // Auto-save on change
      editorInstanceRef.current.onDidChangeModelContent(() => {
        if (!currentFile || !container) return;
        const value = editorInstanceRef.current!.getValue();
        container.fs.writeFile(currentFile, value).catch(console.error);
      });
    });

    return () => {
      disposed = true;
      editorInstanceRef.current?.dispose();
      monacoRef.current = null;
    };
  }, [container]);

  // Handle file open events
  useEffect(() => {
    const handler = (e: CustomEvent<{ path: string; content: string }>) => {
      const { path, content } = e.detail;
      setCurrentFile(path);

      const ext = path.split('.').pop()?.toLowerCase() || '';
      const languageMap: Record<string, string> = {
        ts: 'typescript',
        tsx: 'typescript',
        js: 'javascript',
        jsx: 'javascript',
        json: 'json',
        html: 'html',
        css: 'css',
        md: 'markdown',
        yaml: 'yaml',
        yml: 'yaml',
      };
      const language = languageMap[ext] || 'plaintext';

      if (editorInstanceRef.current && monacoRef.current) {
        // Prevent layout thrashing
        editorInstanceRef.current.setValue(content);
        const model = editorInstanceRef.current.getModel();
        if (model) {
          monacoRef.current.editor.setModelLanguage(model, language);
        }
        editorInstanceRef.current.focus();
      }
    };

    window.addEventListener('open-file', handler as EventListener);
    return () => window.removeEventListener('open-file', handler as EventListener);
  }, []);

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* File path bar */}
      <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 flex items-center">
        <span className="text-sm font-medium text-gray-300 truncate max-w-xs">
          {currentFile || 'No file selected'}
        </span>
      </div>

      {/* Editor container – uses Tailwind calc() to avoid double h-full warning */}
      <div
        ref={editorRef}
        className="flex-1 bg-gray-900"
        style={{ height: 'calc(100% - 43px)' }}
      />
    </div>
  );
}