// src/components/Preview.tsx
import { useEffect, useState } from "react";

export const Preview: React.FC = () => {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data.type === 'serverReady' && e.data.url) {
        setUrl(e.data.url);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  if (!url) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100 text-gray-600">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p>Booting server on port 3000...</p>
        </div>
      </div>
    );
  }

  return (
    <iframe
      src={url}
      className="w-full h-full border-0"
      title="Preview"
      sandbox="allow-scripts allow-same-origin allow-modals allow-forms allow-popups"
      allow="cross-origin-isolated"
    />
  );
};