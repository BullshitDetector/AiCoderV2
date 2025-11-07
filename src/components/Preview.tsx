import React, { CSSProperties } from 'react';
import { useWebContainerContext } from '../context/WebContainerContext';

interface PreviewProps {
  className?: string;
  style?: CSSProperties;
}

const Preview: React.FC<PreviewProps> = ({ className, style }) => {
  const { url } = useWebContainerContext();

  if (!url) {
    return (
      <div className={`flex flex-col items-center justify-center h-full text-gray-400 ${className}`} style={style}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
        <p>Booting preview server...</p>
      </div>
    );
  }

  return (
    <iframe
      src={url}
      className={`w-full h-full border-0 ${className}`}
      style={style}
      title="Preview"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-modals"
    />
  );
};

export default Preview;