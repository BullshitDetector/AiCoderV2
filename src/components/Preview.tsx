import React, { CSSProperties } from 'react';

interface PreviewProps {
  className?: string;
  style?: CSSProperties;
}

const Preview: React.FC<PreviewProps> = ({ className, style }) => {
  // Stub - Implement WebContainer iframe or preview
  return (
    <div className={`p-4 ${className}`} style={style}>
      Preview Panel (Integrate WebContainer runtime here for live app view)
    </div>
  );
};

export default Preview;