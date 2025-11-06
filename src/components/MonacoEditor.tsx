// src/components/MonacoEditor.tsx
import React, { useEffect, useRef } from 'react';
import * as monaco from 'monaco-editor';
import { useWebContainer } from '../hooks/useWebContainer';

export default function MonacoEditor() {
  const divRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const { container: wc } = useWebContainer();

  useEffect(() => {
    if (!divRef.current || !wc) return;

    const editor = monaco.editor.create(divRef.current, {
      value: '// Select a file in the tree\n',
      language: 'typescript',
      theme: 'vs-dark',
      automaticLayout: true,
    });
    editorRef.current = editor;

    return () => editor.dispose();
  }, [wc]);

  return <div ref={divRef} className="h-full" />;
}