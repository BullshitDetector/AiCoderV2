// src/components/Preview.tsx
import React, { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useWebContainer } from '../hooks/useWebContainer';

const Preview: React.FC = () => {
  const { iframeRef, startContainer, isReady } = useWebContainer();
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isReady) {
      setUrl('/__webcontainer__/index.html');
    }
  }, [isReady]);

  return (
    <div className="h-full bg-white flex flex-col">
      <div className="bg-gray-800 text-white px-3 py-1.5 text-xs flex items-center justify-between border-b border-gray-700">
        <span className="font-medium">Preview</span>
        <button
          onClick={startContainer}
          className="flex items-center gap-1 px-2 py-0.5 bg-blue-600 hover:bg-blue-700 rounded text-xs transition-colors"
          title="Restart WebContainer"
        >
          <RefreshCw className="w-3 h-3" />
          Restart
        </button>
      </div>

      {url ? (
        <iframe
          ref={iframeRef}
          src={url}
          className="flex-1 w-full border-0"
          title="Live Preview"
          sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups"
        />
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
            <p>Starting WebContainer...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Preview;