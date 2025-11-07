import React, { CSSProperties } from 'react';
import { useWebContainerContext } from '../context/WebContainerContext';

interface PreviewProps {
  className?: string;
  style?: CSSProperties;
}

const Preview: React.FC<PreviewProps> = ({ className, style }) => {
  const { url } = useWebContainerContext();

  if (!url) {
    return <div className={`flex items-center justify-center h-full text-gray-400 ${className}`} style={style}>Booting preview...</div>;
  }

  return (
    <iframe
      src={url}
      className={`w-full h-full border-0 ${className}`}
      style={style}
      title="Preview"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
    />
  );
};

export default Preview;