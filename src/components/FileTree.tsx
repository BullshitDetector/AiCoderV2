// src/components/FileTree.tsx
import React, { useEffect, useState } from 'react';
import { useWebContainer } from '../hooks/useWebContainer';

export default function FileTree() {
  const { container: wc } = useWebContainer();
  const [tree, setTree] = useState<string[]>([]);

  useEffect(() => {
    if (!wc) return;
    (async () => {
      const files = await wc.fs.readdir('src', { withFileTypes: true });
      const paths = files
        .filter((f) => f.isFile())
        .map((f) => `src/${f.name}`);
      setTree(paths);
    })();
  }, [wc]);

  return (
    <div className="p-2 text-sm">
      <div className="font-medium mb-1">src/</div>
      {tree.map((path) => (
        <div key={path} className="pl-4 hover:bg-gray-100 cursor-pointer">
          {path.split('/').pop()}
        </div>
      ))}
    </div>
  );
}