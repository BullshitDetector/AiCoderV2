// src/components/Preview.tsx
import React from 'react';
import { useWebContainer } from '../hooks/useWebContainer';

export default function Preview() {
  const { ready, error, logs } = useWebContainer();

  return (
    <div className="h-full flex flex-col bg-gray-900 text-gray-100">
      <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 flex items-center justify-between">
        <h3 className="font-medium">Preview</h3>
        <div className="flex items-center gap-2">
          {ready && <span className="text-green-400 text-xs">● Ready</span>}
          {error && <span className="text-red-400 text-xs">● Error</span>}
        </div>
      </div>

      <div className="flex-1 relative">
        {ready ? (
          <iframe
            src="/preview"
            className="absolute inset-0 w-full h-full border-0"
            title="Preview"
            sandbox="allow-scripts allow-same-origin allow-modals allow-forms"
          />
        ) : (
          <div className="flex flex-col h-full">
            <div className="flex-1 flex items-center justify-center">
              {error ? (
                <p className="text-red-400">{error}</p>
              ) : (
                <p className="text-gray-500">Booting WebContainer...</p>
              )}
            </div>
            <pre className="text-xs p-4 bg-black overflow-auto h-48">
              {logs.join('')}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}