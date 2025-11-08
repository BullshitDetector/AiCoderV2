// src/components/Preview.tsx
import React, { useEffect, useState } from 'react';
import { useWebContainer } from '../hooks/useWebContainer';

export default function Preview() {
  const { ready, logs, previewUrl } = useWebContainer();
  const [iframeSrc, setIframeSrc] = useState('');

  useEffect(() => {
    const handler = (e: any) => setIframeSrc(e.detail.url);
    window.addEventListener('webcontainer-ready', handler);
    return () => window.removeEventListener('webcontainer-ready', handler);
  }, []);

  return (
    <div className="h-full flex flex-col bg-gray-900 text-gray-100">
      <div className="bg-gray-800 px-4 py-2 border-b border-gray-700">
        <h3 className="font-medium">Preview {ready && 'Ready'}</h3>
      </div>
      <div className="flex-1 relative">
        {ready && iframeSrc ? (
          <iframe
            src={iframeSrc}
            className="absolute inset-0 w-full h-full"
            sandbox="allow-scripts allow-same-origin allow-modals allow-forms"
          />
        ) : (
          <div className="flex flex-col h-full">
            <div className="flex-1 flex items-center justify-center text-gray-500">
              {ready ? 'Loading preview...' : 'Booting WebContainer...'}
            </div>
            <pre className="text-xs p-3 bg-black overflow-auto h-32">
              {logs.join('')}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}