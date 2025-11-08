// src/components/MonacoEditor.tsx
import React, { useEffect, useRef, useState } from 'react';
import loader from '@monaco-editor/loader';
import { useWebContainer } from '../hooks/useWebContainer';

export default function MonacoEditor() {
  const editorRef = useRef<HTMLDivElement>(null);
  const monacoRef = useRef<any>(null);
  const editorInstanceRef = useRef<any>(null);
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const { container } = useWebContainer();

  useEffect(() => {
    if (!editorRef.current) return;

    loader.init().then((monaco) => {
      monacoRef.current = monaco;

      editorInstanceRef.current = monaco.editor.create(editorRef.current, {
        value: '// Select a file to start editing\n',
        language: 'typescript',
        theme: 'vs-dark',
        automaticLayout: true,
        minimap: { enabled: false },
        fontSize: 14,
        scrollBeyondLastLine: false,
      });

      // Auto-save on change
      editorInstanceRef.current.onDidChangeModelContent(() => {
        if (!currentFile || !container) return;
        const value = editorInstanceRef.current.getValue();
        container.fs.writeFile(currentFile, value).catch(console.error);
      });
    });

    return () => {
      editorInstanceRef.current?.dispose();
    };
  }, [container]);

  useEffect(() => {
    const handler = (e: any) => {
      const { path, content } = e.detail;
      setCurrentFile(path);

      const ext = path.split('.').pop();
      const language = {
        ts: 'typescript',
        tsx: 'typescript',
        js: 'javascript',
        jsx: 'javascript',
        json: 'json',
        html: 'html',
        css: 'css',
      }[ext || ''] || 'plaintext';

      if (editorInstanceRef.current) {
        editorInstanceRef.current.setValue(content);
        const model = editorInstanceRef.current.getModel();
        if (model) {
          monacoRef.current?.editor.setModelLanguage(model, language);
        }
      }
    };

    window.addEventListener('open-file', handler);
    return () => window.removeEventListener('open-file', handler);
  }, []);

  return (
    <div className="h-full bg-gray-900">
      <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 flex items-center justify-between">
        <span className="text-sm font-medium truncate max-w-xs">
          {currentFile || 'No file selected'}
        </span>
      </div>
      <div ref={editorRef} className="h-full" style={{ height: 'calc(100% - 43px)' }} />
    </div>
  );
}