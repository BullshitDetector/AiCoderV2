import React, { CSSProperties } from 'react';

interface FileTreeProps {
  className?: string;
  style?: CSSProperties;
}

const FileTree: React.FC<FileTreeProps> = ({ className, style }) => {
  // Stub - Implement real file tree with WebContainer files
  return (
    <div className={`overflow-auto ${className}`} style={style}>
      File Tree Panel (Stub - List project files here)
    </div>
  );
};

export default FileTree;