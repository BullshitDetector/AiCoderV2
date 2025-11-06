// src/components/FileExplorer.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ChevronRight, ChevronDown, File, Folder, FolderOpen, RefreshCw } from 'lucide-react';
import { refreshFileTree, FileNode, readFile, writeFile } from '../services/fileService';
import { webContainerState } from '../hooks/useWebContainer';

interface FileExplorerProps {
  onFileSelect: (path: string, content: string) => void;
  selectedPath: string;
}

export default function FileExplorer({ onFileSelect, selectedPath }: FileExplorerProps) {
  const [tree, setTree] = useState<FileNode | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['/', '/src']));
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadTree = useCallback(async () => {
    setRefreshing(true);
    try {
      const root = await refreshFileTree();
      setTree(root);
    } catch (error) {
      console.error('Failed to load file tree:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadTree();
  }, [loadTree]);

  // Auto-refresh when WebContainer is ready
  useEffect(() => {
    const unsubscribe = webContainerState.subscribe((state) => {
      if (state.ready && !tree) {
        loadTree();
      }
    });
    return unsubscribe;
  }, [tree, loadTree]);

  const toggle = (path: string) => {
    const next = new Set(expanded);
    if (next.has(path)) next.delete(path);
    else next.add(path);
    setExpanded(next);
  };

  const handleFileClick = async (node: FileNode) => {
    if (node.type === 'file') {
      try {
        const content = await readFile(node.path);
        onFileSelect(node.path, content);
      } catch (error) {
        console.error('Failed to read file:', error);
      }
    } else {
      toggle(node.path);
    }
  };

  const renderNode = (node: FileNode, depth = 0): JSX.Element => {
    const isExpanded = expanded.has(node.path);
    const isSelected = selectedPath === node.path;
    const Icon = node.type === 'directory'
      ? (isExpanded ? FolderOpen : Folder)
      : File;

    return (
      <div key={node.path}>
        <div
          className={`flex items-center gap-1 px-2 py-1.5 hover:bg-gray-700 cursor-pointer select-none transition-colors ${
            isSelected ? 'bg-blue-900 text-blue-100' : 'text-gray-300'
          }`}
          style={{ paddingLeft: `${depth * 16}px` }}
          onClick={() => handleFileClick(node)}
        >
          {node.type === 'directory' && (
            <span className="w-4 h-4">
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </span>
          )}
          {node.type === 'file' && <span className="w-4" />}
          <Icon size={14} className={node.type === 'file' ? 'ml-1' : ''} />
          <span className="text-xs font-medium truncate">{node.name}</span>
        </div>

        {node.type === 'directory' && isExpanded && node.children?.map(child => renderNode(child, depth + 1))}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-gray-900 text-gray-200 font-mono text-xs overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-800 border-b border-gray-700">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Explorer</span>
        <button
          onClick={loadTree}
          disabled={refreshing}
          className="p-1 hover:bg-gray-700 rounded transition-colors disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto py-1">
        {loading ? (
          <div className="flex items-center justify-center h-32 text-gray-500">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500 mb-2"></div>
              <p className="text-xs">Loading files...</p>
            </div>
          </div>
        ) : tree ? (
          renderNode(tree)
        ) : (
          <div className="px-3 py-8 text-center text-gray-500">
            <p className="text-xs">No files found</p>
            <p className="text-xs mt-1">Generate code to get started</p>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="px-3 py-1 bg-gray-800 border-t border-gray-700 text-xs text-gray-400">
        {tree && (
          <span>
            {Object.keys(tree).length} files
          </span>
        )}
      </div>
    </div>
  );
}