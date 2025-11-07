import React, { CSSProperties } from 'react';
import Editor from '@monaco-editor/react';
import { useWebContainerContext } from '../context/WebContainerContext';

interface MonacoEditorProps {
  className?: string;
  style?: CSSProperties;
}

const MonacoEditor: React.FC<MonacoEditorProps> = ({ className, style }) => {
  const { wc, files, currentFile } = useWebContainerContext();

  if (!currentFile) {
    return <div className={`flex items-center justify-center h-full text-gray-400 ${className}`} style={style}>Select a file to edit</div>;
  }

  const value = files[currentFile] || '';

  const handleChange = async (newValue: string | undefined) => {
    if (wc && currentFile) {
      await wc.fs.writeFile(currentFile, newValue || '');
      // fs-change will trigger files update in hook
    }
  };

  const language = getLanguageFromPath(currentFile);

  return (
    <div className={className} style={style}>
      <Editor
        height="100%"
        path={currentFile}
        defaultLanguage={language}
        theme="vs-dark"
        value={value}
        onChange={handleChange}
        options={{
          minimap: { enabled: true },
          scrollBeyondLastLine: false,
          fontSize: 14,
          wordWrap: 'on',
        }}
      />
    </div>
  );
};

function getLanguageFromPath(path: string): string {
  if (path.endsWith('.tsx') || path.endsWith('.ts')) return 'typescript';
  if (path.endsWith('.jsx') || path.endsWith('.js')) return 'javascript';
  if (path.endsWith('.json')) return 'json';
  if (path.endsWith('.html')) return 'html';
  if (path.endsWith('.css')) return 'css';
  return 'plaintext';
}

export default MonacoEditor;