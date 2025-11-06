// src/components/Preview.tsx
import React from 'react';
import { useWebContainer } from '../hooks/useWebContainer';

export default function Preview() {
  const { url } = useWebContainer();

  if (!url) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Booting WebContainer...
      </div>
    );
  }

  return (
    <iframe
      src={url}
      title="Preview"
      className="w-full h-full border-0"
      sandbox="allow-scripts allow-same-origin"
    />
  );
}