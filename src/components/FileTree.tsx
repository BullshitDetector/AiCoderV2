// src/components/FileTree.tsx
import React, { useEffect, useState } from 'react';
import { File, Folder, ChevronRight, ChevronDown, FileCode } from 'lucide-react';
import { useWebContainer } from '../hooks/useWebContainer';

interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: TreeNode[];
}

export default function FileTree() {
  const { container } = useWebContainer();
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['src']));
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  const toggleExpand = (path: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const readDirectory = async (dirPath: string): Promise<TreeNode[]> => {
    if (!container) return [];
    try {
      const entries = await container.fs.readdir(dirPath, { withFileTypes: true });
      const nodes: TreeNode[] = [];

      for (const entry of entries) {
        const fullPath = dirPath === '/' ? `/${entry.name}` : `${dirPath}/${entry.name}`;
        if (entry.isDirectory()) {
          nodes.push({
            name: entry.name,
            path: fullPath,
            type: 'directory',
            children: await readDirectory(fullPath),
          });
        } else {
          nodes.push({
            name: entry.name,
            path: fullPath,
            type: 'file',
          });
        }
      }
      return nodes.sort((a, b) => {
        if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
    } catch (err) {
      console.error('Failed to read dir:', dirPath, err);
      return [];
    }
  };

  useEffect(() => {
    if (!container) return;

    const loadTree = async () => {
      const root = await readDirectory('/');
      setTree(root);
    };

    loadTree();

    // Listen to file changes and refresh tree
    const watcher = container.fs.watch('/', { recursive: true }, async (event, filename) => {
      if (!filename) return;
      console.log('FS Event:', event, filename);
      const root = await readDirectory('/');
      setTree(root);
    });

    return () => {
      watcher?.close();
    };
  }, [container]);

  const handleFileClick = async (path: string) => {
    if (!container) return;
    setSelectedPath(path);
    try {
      const content = await container.fs.readFile(path, 'utf-8');
      // Emit event to open in editor
      window.dispatchEvent(new CustomEvent('open-file', {
        detail: { path, content }
      }));
    } catch (err) {
      console.error('Failed to read file:', err);
    }
  };

  const renderNode = (node: TreeNode, depth = 0) => {
    const isExpanded = expanded.has(node.path);
    const hasChildren = node.type === 'directory' && node.children && node.children.length > 0;

    return (
      <div key={node.path}>
        <div
          className={`flex items-center gap-1.5 px-2 py-1.5 hover:bg-gray-700 cursor-pointer rounded select-none text-sm
            ${selectedPath === node.path ? 'bg-blue-600 text-white' : 'text-gray-300'}`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={(e) => {
            e.stopPropagation();
            if (node.type === 'directory') {
              toggleExpand(node.path);
            } else {
              handleFileClick(node.path);
            }
          }}
        >
          {node.type === 'directory' ? (
            hasChildren ? (
              isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
            ) : (
              <Folder className="w-4 h-4 text-yellow-500" />
            )
          ) : (
            <FileCode className="w-4 h-4 text-green-400" />
          )}
          <span className="truncate">{node.name}</span>
        </div>
        {node.type === 'directory' && isExpanded && node.children?.map(child => renderNode(child, depth + 1))}
      </div>
    );
  };

  return (
    <div className="h-full bg-gray-900 text-gray-100 flex flex-col">
      <div className="px-4 py-3 border-b border-gray-700">
        <h3 className="font-semibold text-sm uppercase tracking-wider">Explorer</h3>
      </div>
      <div className="flex-1 overflow-y-auto py-2">
        {tree.length === 0 ? (
          <div className="text-center text-gray-500 text-sm mt-8">Loading files...</div>
        ) : (
          tree.map(node => renderNode(node))
        )}
      </div>
    </div>
  );
}